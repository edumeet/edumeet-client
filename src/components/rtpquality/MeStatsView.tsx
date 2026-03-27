import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';
import { ProducerSource } from '../../utils/types';
import { Logger } from '../../utils/Logger';

const logger = new Logger('MeStatsView');

interface MeStatsViewProps {
	source?: ProducerSource;
	producerId?: string;
}

type OutboundStats = {
	ssrc: number;
	sendingKbps?: number;
	RTT?: number;
	frameWidth?: number;
	frameHeight?: number;
	framesPerSecond?: number;
}

function getProducerRtpInfo(mediaService: { mediaSenders: Record<string, { producer?: unknown }> }, source?: ProducerSource, producerId?: string): { codec?: string; mode?: string; maxSpatialLayer?: number; maxSpatialLayerCount?: number } {
	let producer: unknown;

	if (source) {
		producer = mediaService.mediaSenders[source].producer;
	} else if (producerId) {
		for (const sender of Object.values(mediaService.mediaSenders)) {
			const p = sender.producer as { id?: string } | undefined;

			if (p?.id === producerId) {
				producer = p;
				break;
			}
		}
	}

	if (!producer) return {};

	const rtpParams = (producer as {
		rtpParameters?: {
			codecs?: Array<{ mimeType?: string }>;
			encodings?: Array<{ scalabilityMode?: string }>;
		};
	}).rtpParameters;

	const codec = rtpParams?.codecs?.[0]?.mimeType?.split('/')?.[1]?.toUpperCase();
	const encodings = rtpParams?.encodings ?? [];
	const scalabilityMode = encodings[0]?.scalabilityMode;
	const isSimulcast = encodings.length > 1;
	const spatialLayers = parseInt(scalabilityMode?.match(/^L(\d+)/)?.[1] ?? '1');
	const isSVC = (codec === 'VP9' || codec === 'AV1') && spatialLayers > 1;
	const mode = isSVC ? `SVC ${scalabilityMode}` : isSimulcast ? 'simulcast' : undefined;

	const maxSpatialLayer = (producer as { maxSpatialLayer?: number }).maxSpatialLayer;
	const maxSpatialLayerCount = isSimulcast ? encodings.length - 1
		: isSVC ? spatialLayers - 1
			: undefined;

	return { codec, mode, maxSpatialLayer, maxSpatialLayerCount };
}

const MeStatsView = ({
	source,
	producerId,
}: MeStatsViewProps): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ outboundStats, setOutboundStats ] = useState<OutboundStats[]>([]);
	const [ codecLine, setCodecLine ] = useState<string | undefined>();

	useEffect(() => {
		const monitor = mediaService.monitor;

		logger.debug('Stats init() producerId=%s, source=%s', producerId, source);

		if (!monitor) return;
		if (source && producerId) return;

		setOutboundStats([]);
		setCodecLine(undefined);

		const listener = () => {
			let trackId: string | undefined;

			if (source) {
				trackId = mediaService.mediaSenders[source].track?.id;
			} else if (producerId) {
				for (const sender of Object.values(mediaService.mediaSenders)) {
					const p = sender.producer as { id?: string; track?: MediaStreamTrack } | undefined;

					if (p?.id === producerId) {
						trackId = (p as unknown as { track?: MediaStreamTrack }).track?.id;
						break;
					}
				}
			}

			logger.debug('Stats trackId=%s', trackId);

			if (!trackId && !producerId) return;

			const mon = monitor as unknown as {
				mappedPeerConnections: Map<string, {
					mappedMediaSourceMonitors: Map<string, { trackIdentifier?: string }>;
				}>;
				outboundRtps?: Array<{
					ssrc?: number;
					bitrate?: number;
					frameWidth?: number;
					frameHeight?: number;
					framesPerSecond?: number;
					mediaSourceId?: string;
					getRemoteInboundRtp?: () => { roundTripTime?: number } | undefined;
				}>;
			};

			// Find mediaSourceIds whose trackIdentifier matches our track.
			// We do this lookup ourselves because OutboundRtpMonitor.trackIdentifier
			// goes through getMediaSource() which can be undefined if stats are
			// processed in media-source-after-outbound-rtp order.
			const matchingSourceIds = new Set<string>();

			if (trackId) {
				for (const pc of mon.mappedPeerConnections.values()) {
					for (const [ id, src ] of pc.mappedMediaSourceMonitors) {
						if (src.trackIdentifier === trackId) {
							matchingSourceIds.add(id);
						}
					}
				}
			}

			logger.debug('Stats matchingSourceIds=%s', matchingSourceIds.size);

			if (matchingSourceIds.size === 0) return;

			const allOutboundRtps = mon.outboundRtps ?? [];
			const matchingRtps = allOutboundRtps.filter((rtp) => rtp.mediaSourceId && matchingSourceIds.has(rtp.mediaSourceId));

			logger.debug('Stats matchingRtps.length=%s', matchingRtps.length);

			if (matchingRtps.length === 0) return;

			const { codec, mode, maxSpatialLayer, maxSpatialLayerCount } = getProducerRtpInfo(mediaService, source, producerId);

			const layerInfo = (maxSpatialLayerCount !== undefined && maxSpatialLayer !== undefined)
				? ` (max layer ${maxSpatialLayer}/${maxSpatialLayerCount})`
				: '';

			setCodecLine([ codec, mode ].filter(Boolean).join(' ') + layerInfo || undefined);

			const newOutboundStats = matchingRtps.map((rtp) => ({
				ssrc: rtp.ssrc ?? 0,
				sendingKbps: Math.floor((rtp.bitrate ?? 0) / 1000),
				frameWidth: rtp.frameWidth,
				frameHeight: rtp.frameHeight,
				framesPerSecond: rtp.framesPerSecond,
				RTT: Math.round(Math.max(0, rtp.getRemoteInboundRtp?.()?.roundTripTime ?? 0) * 1000),
			}));

			logger.debug('Stats newOutboundStats=%o', newOutboundStats);
			setOutboundStats(newOutboundStats);
		};

		monitor.on('stats-collected', listener);
		listener();

		return () => {
			monitor.off('stats-collected', listener);
		};
	}, [ mediaService, producerId, source, mediaService.monitor ]);

	return (
		<Stats
			orientation='vertical'
			horizontalPlacement='left'
			verticalPlacement='bottom'
		>
			{ outboundStats.length === 0 && <div>...</div> }
			{ codecLine && <><span>{codecLine}</span></> }
			{outboundStats.map((stats, index) => (
				<div key={index + 100010}>
					<b>SSRC: {stats.ssrc}</b><br />
					{ stats.frameWidth && stats.frameHeight && <><span>{stats.frameWidth}x{stats.frameHeight}@{stats.framesPerSecond ?? '?'}</span><br /></> }
					<span>{stats.sendingKbps ?? -1} kbps | RTT: {stats.RTT ?? -1} ms</span><br />
				</div>
			))}
		</Stats>
	);
};

export default MeStatsView;
