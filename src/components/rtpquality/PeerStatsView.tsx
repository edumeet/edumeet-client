import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';
import { Logger } from '../../utils/Logger';

const logger = new Logger('PeerStatsView');

interface PeerStatsViewProps {
	consumerId: string;
}

type InboundStats = {
	ssrc: number;
	receivedKbps?: number;
	fractionLoss?: number;
	meanOpinionScore?: number;
	codec?: string;
	scalabilityMode?: string;
	spatialLayer?: number;
	temporalLayer?: number;
	preferredSpatialLayer?: number;
	preferredTemporalLayer?: number;
	frameWidth?: number;
	frameHeight?: number;
	framesPerSecond?: number;
}

function createInboundStatsFromTrackMonitor(trackMonitor: unknown): InboundStats[] {
	const tm = trackMonitor as {
		getInboundRtp?: () => {
			ssrc?: number;
			bitrate?: number;
			fractionLost?: number;
			frameWidth?: number;
			frameHeight?: number;
			framesPerSecond?: number;
		};
		score?: number;
		calculatedScore?: {
			value?: number;
		};
	};

	const rtp = tm.getInboundRtp?.();

	if (!rtp) return [];

	const mos = (typeof tm.calculatedScore?.value === 'number')
		? tm.calculatedScore.value
		: (typeof tm.score === 'number')
			? tm.score
			: undefined;

	return [ {
		ssrc: rtp.ssrc ?? 0,
		receivedKbps: Math.floor(((rtp.bitrate ?? 0) / 1000)),
		fractionLoss: Math.round((rtp.fractionLost ?? 0) * 100) / 100,
		meanOpinionScore: mos,
		frameWidth: rtp.frameWidth,
		frameHeight: rtp.frameHeight,
		framesPerSecond: rtp.framesPerSecond,
	} ];
}

function getTrackMonitorByIdOrMatch(
	monitor: unknown,
	trackId?: string,
	kind?: 'audio' | 'video',
	label?: string,
	consumerId?: string,
): unknown | undefined {
	const m = monitor as {
		tracks?: Array<{
			track?: MediaStreamTrack;
			direction?: 'inbound' | 'outbound';
			attachments?: {
				consumerId?: string;
			};
		} & Record<string, unknown>>;
	};

	const tracks = m.tracks ?? [];

	if (consumerId) {
		for (const t of tracks) {
			if (t.attachments?.consumerId === consumerId) {
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
		if (t.direction !== 'inbound') continue;
		if (kind && t.track?.kind !== kind) continue;
		if (label && t.track?.label !== label) continue;

		return t;
	}

	return undefined;
}

const PeerStatsView = ({ consumerId }: PeerStatsViewProps): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ inboundStats, setInboundStats ] = useState<InboundStats[]>([]);

	useEffect(() => {
		const monitor = mediaService.monitor;

		logger.debug('Stats init() consumerId=%s', consumerId);

		if (!monitor) return;

		setInboundStats([]);

		const listener = () => {
			const consumer = mediaService.getConsumer(consumerId);
			const track = consumer?.track;
			const trackId = track?.id;
			const trackKind = (track?.kind as 'audio' | 'video' | undefined);
			const trackLabel = track?.label;

			logger.debug('Stats trackId=%s', trackId);

			const tracksCount = (monitor as unknown as { tracks?: unknown[] }).tracks?.length ?? 0;

			logger.debug('Stats monitor.tracks.length=%s', tracksCount);

			const trackMonitor = getTrackMonitorByIdOrMatch(
				monitor, trackId, trackKind, trackLabel, consumerId
			);

			logger.debug('Stats trackMonitor=%o', trackMonitor);

			if (!trackMonitor) return;

			const rtpParams = (consumer as unknown as {
				rtpParameters?: {
					codecs?: Array<{ mimeType?: string }>;
					encodings?: Array<{ scalabilityMode?: string }>;
				};
			})?.rtpParameters;

			const codec = rtpParams?.codecs?.[0]?.mimeType?.split('/')?.[1]?.toUpperCase();
			const scalabilityMode = rtpParams?.encodings?.[0]?.scalabilityMode;
			const layers = mediaService.consumerCurrentLayers.get(consumerId);
			const preferred = mediaService.consumerPreferredLayers.get(consumerId);

			const newInboundStats = createInboundStatsFromTrackMonitor(trackMonitor).map((s) => ({
				...s,
				codec,
				scalabilityMode,
				spatialLayer: layers?.spatialLayer,
				temporalLayer: layers?.temporalLayer,
				preferredSpatialLayer: preferred?.spatialLayer,
				preferredTemporalLayer: preferred?.temporalLayer,
			}));

			logger.debug('Stats newInboundStats=%o', newInboundStats);
			setInboundStats(newInboundStats);
		};

		monitor.on('stats-collected', listener);
		listener();

		return () => {
			monitor.off('stats-collected', listener);
		};
	}, [ mediaService, consumerId, mediaService.monitor ]);

	return (
		<Stats
			orientation='vertical'
			horizontalPlacement='left'
			verticalPlacement='bottom'
		>
			{ inboundStats.length === 0 && <div>...</div> }
			{inboundStats.map((stats, index) => (
				<div key={index + 10}>
					<b key={index + 1}>SSRC: {stats.ssrc}</b><br />
					{ stats.codec && <><span>{stats.codec}{ stats.scalabilityMode ? ` SVC ${stats.scalabilityMode}` : stats.spatialLayer !== undefined ? ' simulcast' : '' }</span><br /></> }
					{ (stats.spatialLayer !== undefined || stats.temporalLayer !== undefined) &&
						<><span>SL {stats.spatialLayer ?? '?'}/{stats.preferredSpatialLayer ?? '?'} | TL {stats.temporalLayer ?? '?'}/{stats.preferredTemporalLayer ?? '?'}</span><br /></>
					}
					{ stats.frameWidth && stats.frameHeight && <><span>resolution: {stats.frameWidth}x{stats.frameHeight}@{stats.framesPerSecond ?? '?'}</span><br /></> }
					<span key={index + 2}>receiving: {stats.receivedKbps ?? -1} kbps</span><br />
					<span key={index + 3}>FractionLoss: {stats.fractionLoss ?? -1}</span><br />
					<span key={index + 4}>MOS: {stats.meanOpinionScore}</span><br />
				</div>
			))}
		</Stats>
	);
};

export default PeerStatsView;
