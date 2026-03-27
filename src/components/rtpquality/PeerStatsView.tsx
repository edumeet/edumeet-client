import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';
import { Logger } from '../../utils/Logger';

const logger = new Logger('PeerStatsView');

interface PeerStatsViewProps {
	consumerId: string;
	audioConsumerId?: string;
}

type InboundStats = {
	ssrc: number;
	receivedKbps?: number;
	fractionLoss?: number;
	meanOpinionScore?: number;
	codec?: string;
	scalabilityMode?: string;
	preferredSpatialLayer?: number;
	preferredTemporalLayer?: number;
	frameWidth?: number;
	frameHeight?: number;
	framesPerSecond?: number;
}

type InboundAudioStats = {
	codec?: string;
	receivedKbps?: number;
	fractionLoss?: number;
	meanOpinionScore?: number;
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

function isSVCCodec(codec: string): boolean {
	return codec === 'VP9' || codec === 'AV1';
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

const PeerStatsView = ({ consumerId, audioConsumerId }: PeerStatsViewProps): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ inboundStats, setInboundStats ] = useState<InboundStats[]>([]);
	const [ inboundAudioStats, setInboundAudioStats ] = useState<InboundAudioStats | null>(null);

	useEffect(() => {
		const monitor = mediaService.monitor;

		logger.debug('Stats init() consumerId=%s audioConsumerId=%s', consumerId, audioConsumerId);

		if (!monitor) return;

		setInboundStats([]);
		setInboundAudioStats(null);

		const listener = () => {
			// Video stats
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

			if (trackMonitor) {
				const rtpParams = (consumer as unknown as {
					rtpParameters?: {
						codecs?: Array<{ mimeType?: string }>;
						encodings?: Array<{ scalabilityMode?: string }>;
					};
				})?.rtpParameters;

				const codec = rtpParams?.codecs?.[0]?.mimeType?.split('/')?.[1]?.toUpperCase();
				const scalabilityMode = rtpParams?.encodings?.[0]?.scalabilityMode;
				const preferred = mediaService.consumerPreferredLayers.get(consumerId);

				const newInboundStats = createInboundStatsFromTrackMonitor(trackMonitor).map((s) => ({
					...s,
					codec,
					scalabilityMode,
					preferredSpatialLayer: preferred?.spatialLayer,
					preferredTemporalLayer: preferred?.temporalLayer,
				}));

				logger.debug('Stats newInboundStats=%o', newInboundStats);
				setInboundStats(newInboundStats);
			}

			// Audio stats
			if (audioConsumerId) {
				const audioConsumer = mediaService.getConsumer(audioConsumerId);
				const audioTrack = audioConsumer?.track;
				const audioTrackMonitor = getTrackMonitorByIdOrMatch(
					monitor,
					audioTrack?.id,
					audioTrack?.kind as 'audio' | 'video' | undefined,
					audioTrack?.label,
					audioConsumerId
				);

				if (audioTrackMonitor) {
					const audioRtpParams = (audioConsumer as unknown as {
						rtpParameters?: { codecs?: Array<{ mimeType?: string }> };
					})?.rtpParameters;
					const audioCodec = audioRtpParams?.codecs?.[0]?.mimeType?.split('/')?.[1]?.toUpperCase();
					const audioBase = createInboundStatsFromTrackMonitor(audioTrackMonitor)[0];

					if (audioBase) {
						setInboundAudioStats({
							codec: audioCodec,
							receivedKbps: audioBase.receivedKbps,
							fractionLoss: audioBase.fractionLoss,
							meanOpinionScore: audioBase.meanOpinionScore,
						});
					}
				}
			}
		};

		monitor.on('stats-collected', listener);
		listener();

		return () => {
			monitor.off('stats-collected', listener);
		};
	}, [ mediaService, consumerId, audioConsumerId, mediaService.monitor ]);

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
					{ stats.codec && <><span>{stats.codec}{ isSVCCodec(stats.codec) && stats.scalabilityMode && parseInt(stats.scalabilityMode.match(/^L(\d+)/)?.[1] ?? '1') > 1 ? ` SVC ${stats.scalabilityMode}` : '' }</span><br /></> }
					{ stats.frameWidth && stats.frameHeight && <><span>{stats.frameWidth}x{stats.frameHeight}@{stats.framesPerSecond ?? '?'}</span><br /></> }
					{ (stats.preferredSpatialLayer !== undefined || stats.preferredTemporalLayer !== undefined) &&
						<><span>Requested SL: {stats.preferredSpatialLayer ?? '?'} | TL: {stats.preferredTemporalLayer ?? '?'}</span><br /></>
					}
					<span key={index + 2}>{stats.receivedKbps ?? -1} kbps | FractionLoss: {stats.fractionLoss ?? -1} | MOS: {stats.meanOpinionScore}</span><br />
				</div>
			))}
			{ inboundAudioStats && <hr style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '4px 0', width: '100%' }} /> }
			{ inboundAudioStats && (
				<div>
					{ inboundAudioStats.codec && <><span>{inboundAudioStats.codec}</span><br /></> }
					<span>{inboundAudioStats.receivedKbps ?? -1} kbps | FractionLoss: {inboundAudioStats.fractionLoss ?? -1} | MOS: {inboundAudioStats.meanOpinionScore}</span><br />
				</div>
			)}
		</Stats>
	);
};

export default PeerStatsView;
