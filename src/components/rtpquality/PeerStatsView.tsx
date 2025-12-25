import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';
import { TrackStats } from '@observertc/client-monitor-js';

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

function createOutboundStats(trackStats: TrackStats, avgRttInS?: number): OutboundStats[] {
	if (trackStats.direction !== 'outbound') return [];

	const result: OutboundStats[] = [];

	for (const outboundRtpEntry of trackStats.outboundRtps()) {
		
		const stats = outboundRtpEntry.stats;
		const item: OutboundStats = {
			ssrc: stats.ssrc,
			sendingKbps: Math.floor((outboundRtpEntry.sendingBitrate ?? 0) / 1000),
			Fps: stats.framesPerSecond,
			RTT: Math.round(Math.max(0, avgRttInS ?? 0) * 1000),
		};
		
		result.push(item);
	}

	return result;
}

function createInboundStats(trackStats: TrackStats): InboundStats[] {
	if (trackStats.direction !== 'inbound') return [];

	const result: InboundStats[] = [];

	for (const inboundRtpEntry of trackStats.inboundRtps()) {
		// inboundRtpStats.stats
		
		const item: InboundStats = {
			ssrc: inboundRtpEntry.stats.ssrc,
			receivedKbps: Math.floor(((inboundRtpEntry.receivingBitrate ?? 0) / 1000)),
			fractionLoss: Math.round((inboundRtpEntry.fractionLoss ?? 0) * 100) / 100,
		};

		result.push(item);
	}

	return result;
}

const PeerStatsView = ({
	producerId,
	consumerId,
}: PeerStatsViewProps): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ inboundStats, setInboundStats ] = useState<InboundStats [ ] >([ ]);
	const [ outboundStats, setOutboundStats ] = useState<OutboundStats [ ] >([ ]);

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.monitor;

		if (!monitor) {
			return;
		}

		if ((producerId && consumerId) || (source && consumerId) || (producerId && source)) {
			return;
		}

		const storage = monitor.storage;

		const listener = () => {
			let trackId: string | undefined;

			if (consumerId) {
				const consumer = mediaService.getConsumer(consumerId);

				trackId = consumer?.track?.id;
			} else if (source) {
				trackId = mediaService.mediaSenders[source].track?.id;
			} else if (producerId) {
				for (const sender of Object.values(mediaService.mediaSenders)) {
					const producer = sender.producer;

					if (!producer || producer.id !== producerId) {
						continue;
					}
					trackId = producer.track?.id;

					break;
				}
			}

			if (!trackId) {
				return;
			}

			const trackStats = storage.getTrack(trackId);

			if (!trackStats) {
				return;
			}

			if (consumerId) {
				const newInboundStats = createInboundStats(trackStats);
					
				setInboundStats(newInboundStats);
				setOutboundStats([ ]);
				
				return;
			}

			const newOutboundStats = createOutboundStats(trackStats, storage.avgRttInS);

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