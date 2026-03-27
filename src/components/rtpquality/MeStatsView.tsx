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

function createOutboundStatsFromTrackMonitor(trackMonitor: unknown): OutboundStats[] {
	const tm = trackMonitor as {
		mappedOutboundRtps?: Map<number, unknown>;
	};

	if (!tm.mappedOutboundRtps) return [];

	const result: OutboundStats[] = [];

	for (const outboundRtp of tm.mappedOutboundRtps.values()) {
		const rtp = outboundRtp as {
			ssrc?: number;
			bitrate?: number;
			framesPerSecond?: number;
			frameWidth?: number;
			frameHeight?: number;
			roundTripTime?: number;
			getRemoteInboundRtp?: () => { roundTripTime?: number } | undefined;
		};

		result.push({
			ssrc: rtp.ssrc ?? 0,
			sendingKbps: Math.floor(((rtp.bitrate ?? 0) / 1000)),
			frameWidth: rtp.frameWidth,
			frameHeight: rtp.frameHeight,
			framesPerSecond: rtp.framesPerSecond,
			RTT: Math.round(Math.max(0, rtp.getRemoteInboundRtp?.()?.roundTripTime ?? rtp.roundTripTime ?? 0) * 1000),
		});
	}

	return result;
}

function getTrackMonitorByIdOrMatch(
	monitor: unknown,
	trackId?: string,
	kind?: 'audio' | 'video',
	label?: string,
	direction?: 'inbound' | 'outbound',
	producerId?: string,
): unknown | undefined {
	const m = monitor as {
		tracks?: Array<{
			track?: MediaStreamTrack;
			direction?: 'inbound' | 'outbound';
			attachments?: {
				producerId?: string;
			};
		} & Record<string, unknown>>;
	};

	const tracks = m.tracks ?? [];

	if (producerId) {
		for (const t of tracks) {
			if (t.attachments?.producerId === producerId) {
				return t;
			}
		}
	}

	if (trackId) {
		for (const t of tracks) {
			if (t.track?.id === trackId) {
				return t;
			}
		}
	}

	for (const t of tracks) {
		if (direction && t.direction !== direction) continue;
		if (kind && t.track?.kind !== kind) continue;
		if (label && t.track?.label !== label) continue;

		return t;
	}

	return undefined;
}

function getProducerRtpInfo(mediaService: { mediaSenders: Record<string, { producer?: unknown }> }, source?: ProducerSource, producerId?: string): { codec?: string; mode?: string; maxSpatialLayer?: number; encodingCount?: number } {
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

	return { codec, mode, maxSpatialLayer, encodingCount: encodings.length };
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
			let trackKind: 'audio' | 'video' | undefined;
			let trackLabel: string | undefined;

			if (source) {
				const track = mediaService.mediaSenders[source].track;

				trackId = track?.id;
				trackKind = (track?.kind as 'audio' | 'video' | undefined);
				trackLabel = track?.label;
			} else if (producerId) {
				for (const sender of Object.values(mediaService.mediaSenders)) {
					const producer = sender.producer;

					if (!producer || (producer as { id?: string }).id !== producerId) continue;

					const track = (producer as { track?: MediaStreamTrack }).track;

					trackId = track?.id;
					trackKind = (track?.kind as 'audio' | 'video' | undefined);
					trackLabel = track?.label;

					break;
				}
			}

			logger.debug('Stats trackId=%s', trackId);

			if (!trackId && !producerId) return;

			const tracksCount = (monitor as unknown as { tracks?: unknown[] }).tracks?.length ?? 0;

			logger.debug('Stats monitor.tracks.length=%s', tracksCount);

			const trackMonitor = getTrackMonitorByIdOrMatch(
				monitor, trackId, trackKind, trackLabel, 'outbound', producerId
			);

			logger.debug('Stats trackMonitor=%o', trackMonitor);

			if (!trackMonitor) return;

			const { codec, mode, maxSpatialLayer, encodingCount } = getProducerRtpInfo(mediaService, source, producerId);

			const layerInfo = (encodingCount !== undefined && encodingCount > 1 && maxSpatialLayer !== undefined)
				? ` (max layer ${maxSpatialLayer}/${encodingCount - 1})`
				: '';

			setCodecLine([ codec, mode ].filter(Boolean).join(' ') + layerInfo || undefined);

			const newOutboundStats = createOutboundStatsFromTrackMonitor(trackMonitor);

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
