import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';
import { TrackStats } from '@observertc/client-monitor-js';

// import { Logger } from '../../utils/Logger';

// const logger = new Logger('PeerStatsView');

interface PeerStatsViewProps {
	consumerId?: string;
}

type InboundStats = {
	ssrc: number;
	receivedKbps?: number;
	fractionLoss?: number;
	meanOpinionScore?: number;
	frameWidth?: number;
	frameHeight?: number;
}

function createInboundStats(trackStats: TrackStats): InboundStats[] {
	if (trackStats.direction !== 'inbound') return [];

	const result: InboundStats[] = [];

	for (const inboundRtpEntry of trackStats.inboundRtps()) {
		const stats = inboundRtpEntry.stats;
		
		const item: InboundStats = {
			ssrc: stats.ssrc,
			receivedKbps: Math.floor(((inboundRtpEntry.receivingBitrate ?? 0) / 1000)),
			fractionLoss: Math.round((inboundRtpEntry.fractionLoss ?? 0) * 100) / 100,
			frameWidth: stats.frameWidth ?? 0,
			frameHeight: stats.frameHeight ?? 0,
		};

		result.push(item);
	}

	return result;
}

const PeerStatsView = ({
	consumerId,
}: PeerStatsViewProps): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ inboundStats, setInboundStats ] = useState<InboundStats [ ] >([ ]);

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.monitor;
		
		if (!monitor) {
			return;
		}
		if (!consumerId) {
			return;
		}

		let listener: () => void | undefined;
		const storage = monitor.storage;

		// Debug
		/*
		for (const inboundRtp of storage.inboundRtps()) {
			const receiver = inboundRtp.getReceiver();
			const trackId = inboundRtp.getTrackId();
			const ssrc = inboundRtp.getSsrc();
			const remoteOutboundRtp = inboundRtp.getRemoteOutboundRtp();
			const peerConnection = inboundRtp.getPeerConnection();
			const transport = inboundRtp.getTransport();
			const codec = inboundRtp.getCodec();

			logger.debug(trackId, ssrc,
				inboundRtp.stats,
				remoteOutboundRtp?.stats,
				receiver?.stats,
				peerConnection.stats,
				transport?.stats,
				codec?.stats
			);
		}
		*/
		
		if (consumerId) {
			const consumer = mediaService.getConsumer(consumerId);

			if (consumer) {
				listener = () => {
					const trackId = consumer.track?.id;

					if (!trackId) {
						return;
					}
					const trackStats = storage.getTrack(trackId);

					if (!trackStats) {
						return;
					}

					const newInboundStats = createInboundStats(trackStats);
					
					setInboundStats(newInboundStats);
				};
				monitor.on('stats-collected', listener);
			}
		}

		return () => {
			if (!monitor) {
				return;
			}
			if (listener) {
				monitor.off('stats-collected', listener);
			}
		};
	}, []);

	return (
		<Stats
			orientation='vertical'
			horizontalPlacement='left'
			verticalPlacement='bottom'
		>
			{inboundStats.map((stats, index) => {
				return (
					<div key={index + 10}>
						<b key={index + 1}>SSRC: {stats.ssrc}</b><br />
						<span key={index + 2}>receiving: {stats.receivedKbps ?? -1} kbps</span><br />
						<span key={index + 3}>FractionLoss: {stats.fractionLoss ?? -1}</span><br />
						<span key={index + 4}>MOS: {stats.meanOpinionScore}</span><br />
						<span key={index + 5}>Res: {stats.frameWidth ?? -1}x{stats.frameHeight ?? -1}</span><br />
						<br />
					</div>
				);
			})}
		</Stats>);
};

export default PeerStatsView;