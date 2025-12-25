import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';
import { ProducerSource } from '../../utils/types';
import { Logger } from '../../utils/Logger';

const logger = new Logger('PeerStatsView');

interface PeerStatsViewProps {
	producerId?: string;
	consumerId?: string;
	source?: ProducerSource;
}

type InboundStats = {
	ssrc: number;
	receivedKbps?: number;
	fractionLoss?: number;
	meanOpinionScore?: number;
}

type OutboundStats = {
	ssrc: number;
	sendingKbps?: number;
	RTT?: number;
	Fps?: number;
}

function createOutboundStatsFromTrackMonitor(trackMonitor: unknown): OutboundStats[] {
	const tm = trackMonitor as {
		getOutboundRtps?: () => Array<{
			ssrc: number;
			bitrate?: number;
			framesPerSecond?: number;
			getRemoteInboundRtp?: () => { roundTripTime?: number } | undefined;
		}>;
	};

	if (!tm.getOutboundRtps) return [ ];

	const result: OutboundStats[] = [ ];

	for (const outboundRtp of tm.getOutboundRtps()) {
		const item: OutboundStats = {
			ssrc: outboundRtp.ssrc,
			sendingKbps: Math.floor(((outboundRtp.bitrate ?? 0) / 1000)),
			Fps: outboundRtp.framesPerSecond,
			RTT: Math.round(Math.max(0, outboundRtp.getRemoteInboundRtp?.()?.roundTripTime ?? 0) * 1000),
		};

		result.push(item);
	}

	return result;
}

function createInboundStatsFromTrackMonitor(trackMonitor: unknown): InboundStats[] {
	const tm = trackMonitor as {
		getInboundRtps?: () => Array<{
			ssrc: number;
			bitrate?: number;
			fractionLost?: number;
		}>;
	};

	if (!tm.getInboundRtps) return [ ];

	const result: InboundStats[] = [ ];

	for (const inboundRtp of tm.getInboundRtps()) {
		const item: InboundStats = {
			ssrc: inboundRtp.ssrc,
			receivedKbps: Math.floor(((inboundRtp.bitrate ?? 0) / 1000)),
			fractionLoss: Math.round((inboundRtp.fractionLost ?? 0) * 100) / 100,
		};

		result.push(item);
	}

	return result;
}

function getTrackMonitorByIdOrMatch(
	monitor: unknown,
	trackId: string,
	kind?: 'audio' | 'video',
	label?: string,
	direction?: 'inbound' | 'outbound',
): unknown | undefined {
	const m = monitor as {
		getTrackMonitor?: (trackId: string) => unknown | undefined;
		tracks?: Array<{
			trackId?: string;
			kind?: 'audio' | 'video';
			direction?: 'inbound' | 'outbound';
			label?: string;
		} & Record<string, unknown>>;
	};

	const direct = m.getTrackMonitor?.(trackId);

	if (direct) return direct;

	const tracks = m.tracks ?? [ ];

	for (const t of tracks) {
		if (t.trackId && t.trackId === trackId) {
			return t;
		}
	}

	for (const t of tracks) {
		if (direction && t.direction !== direction) continue;
		if (kind && t.kind !== kind) continue;
		if (label && t.label !== label) continue;

		return t;
	}

	return undefined;
}

const PeerStatsView = ({
	producerId,
	consumerId,
	source,
}: PeerStatsViewProps): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ inboundStats, setInboundStats ] = useState<InboundStats [ ] >([ ]);
	const [ outboundStats, setOutboundStats ] = useState<OutboundStats [ ] >([ ]);
	const [ loading, setLoading ] = useState<boolean>(true);

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.monitor;

		logger.debug('Stats init() producerId=%s, consumerId=%s, source=%s',
			producerId, consumerId, source);

		if (!monitor) {
			return;
		}

		if ((producerId && consumerId) || (source && consumerId) || (producerId && source)) {
			return;
		}

		setLoading(true);

		const listener = () => {
			let trackId: string | undefined;
			let trackKind: 'audio' | 'video' | undefined;
			let trackLabel: string | undefined;
			let direction: 'inbound' | 'outbound' | undefined;

			if (consumerId) {
				const consumer = mediaService.getConsumer(consumerId);
				const track = consumer?.track;

				trackId = track?.id;
				trackKind = (track?.kind as 'audio' | 'video' | undefined);
				trackLabel = track?.label;
				direction = 'inbound';
			} else if (source) {
				const track = mediaService.mediaSenders[source].track;

				trackId = track?.id;
				trackKind = (track?.kind as 'audio' | 'video' | undefined);
				trackLabel = track?.label;
				direction = 'outbound';
			} else if (producerId) {
				for (const sender of Object.values(mediaService.mediaSenders)) {
					const producer = sender.producer;

					if (!producer || producer.id !== producerId) {
						continue;
					}
					const track = producer.track;

					trackId = track?.id;
					trackKind = (track?.kind as 'audio' | 'video' | undefined);
					trackLabel = track?.label;
					direction = 'outbound';

					break;
				}
			}

			logger.debug('Stats trackId=%s', trackId);

			if (!trackId) {
				return;
			}

			const tracksCount = (monitor as unknown as { tracks?: unknown[] }).tracks?.length ?? 0;

			logger.debug('Stats monitor.tracks.length=%s', tracksCount);

			const trackMonitor = getTrackMonitorByIdOrMatch(monitor, trackId, trackKind, trackLabel, direction);

			logger.debug('Stats trackMonitor=%o', trackMonitor);

			if (!trackMonitor) {
				return;
			}

			setLoading(false);

			if (consumerId) {
				const newInboundStats = createInboundStatsFromTrackMonitor(trackMonitor);

				logger.debug('Stats newInboundStats=%o', newInboundStats);

				setInboundStats(newInboundStats);
				setOutboundStats([ ]);

				return;
			}

			const newOutboundStats = createOutboundStatsFromTrackMonitor(trackMonitor);

			logger.debug('Stats newOutboundStats=%o', newOutboundStats);

			setOutboundStats(newOutboundStats);
			setInboundStats([ ]);
		};

		monitor.on('stats-collected', listener);

		return () => {
			if (!monitor) {
				return;
			}

			monitor.off('stats-collected', listener);
		};
	}, [ mediaService, producerId, consumerId, source, mediaService.monitor ]);

	return (
		<Stats
			orientation='vertical'
			horizontalPlacement='left'
			verticalPlacement='bottom'
		>
			{ loading && <div>...</div> }
			{inboundStats.map((stats, index) => {
				return (
					<div key={index + 10}>
						<b key={index + 1}>SSRC: {stats.ssrc}</b><br />
						<span key={index + 2}>receiving: {stats.receivedKbps ?? -1} kbps</span><br />
						<span key={index + 3}>FractionLoss: {stats.fractionLoss ?? -1}</span><br />
						<span key={index + 4}>MOS: {stats.meanOpinionScore}</span><br />
					</div>
				);
			})}
			{outboundStats.map((stats, index) => {
				return (
					<div key={index + 100010}>
						<b key={index + 1}>SSRC: {stats.ssrc}</b><br />
						<span key={index + 2}>sending: {stats.sendingKbps ?? -1} kbps</span><br />
						<span key={index + 3}>RTT: {stats.RTT ?? -1} ms</span><br />
						<span key={index + 4}>Fps: {stats.Fps ?? -1}</span><br />
						<br />
						
					</div>
				);
			})}
		</Stats>);
};

export default PeerStatsView;