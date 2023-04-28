import { InboundTrackEntry, OutboundTrackEntry } from '@observertc/client-monitor-js';
import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';

interface PeerStatsViewProps {
	producerId?: string;
	consumerId?: string;
}

type InboundStats = {
	ssrc: number;
	receivedKbps?: number;
	fractionLoss?: number;
}

type OutboundStats = {
	ssrc: number;
	sendingKbps?: number;
	RTT?: number;
	Fps?: number;
}

function createOutboundStats(trackStats: OutboundTrackEntry): OutboundStats[] {
	const result: OutboundStats[] = [];
					
	for (const outboundRtpEntry of trackStats.outboundRtps()) {
		const remoteInboundRtpEntry = outboundRtpEntry.getRemoteInboundRtp();
		const stats = outboundRtpEntry.stats;
		const { bytesSent, timestamp } = (outboundRtpEntry.appData?.traces || {}) as Record<string, number>;
		const now = Date.now();
		const elapsedTimeInSec = (now - (timestamp ?? 0)) / 1000;
		const dBytesSent = (stats.bytesSent ?? 0) - (bytesSent ?? 0);
		const item: OutboundStats = {
			ssrc: stats.ssrc,
			sendingKbps: Math.floor(((dBytesSent * 8) / 1000) / elapsedTimeInSec),
			Fps: stats.framesPerSecond,
			RTT: (remoteInboundRtpEntry?.stats.roundTripTime ?? 0) * 1000,
		};
		
		result.push(item);

		outboundRtpEntry.appData.traces = {
			bytesSent: stats.bytesSent,
			timestamp: now,
		};
	}

	return result;
}

function createInboundStats(trackStats: InboundTrackEntry): InboundStats[] {
	const result: InboundStats[] = [];

	for (const inboundRtpEntry of trackStats.inboundRtps()) {
		// inboundRtpStats.stats
		const stats = inboundRtpEntry.stats;
		const { 
			packetsLost, 
			packetsReceived, 
			bytesReceived, 
			timestamp } = (inboundRtpEntry.appData?.traces || {}) as Record<string, number>;
		const now = Date.now();
		const elapsedTimeInSec = (now - (timestamp ?? 0)) / 1000;
		const dBytesReceived = (stats.bytesReceived ?? 0) - (bytesReceived ?? 0);
		const dPacketsLost = (stats.packetsLost ?? 0) - (packetsLost ?? 0);
		const dPacketsReceived = (stats.packetsReceived ?? 0) - packetsReceived;
		const item: InboundStats = {
			ssrc: stats.ssrc,
			receivedKbps: Math.floor(((dBytesReceived * 8) / 1000) / elapsedTimeInSec),
			fractionLoss: Math.round(
				(dPacketsLost / (dPacketsLost + dPacketsReceived)) * 100
			) / 100
		};

		result.push(item);

		inboundRtpEntry.appData.traces = {
			packetsLost: stats.packetsLost,
			packetsReceived: stats.packetsReceived,
			bytesReceived: stats.bytesReceived,
			timestamp: now,
		};
	}

	return result;
}

const PeerStatsView = ({
	producerId,
	consumerId,
}: PeerStatsViewProps): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ inboundStats, setInboundStats ] = useState<InboundStats [ ] >([ ]);
	const [ outboundStats, setOutboundStats ] = useState<OutboundStats [ ] >([ ]);

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.getMonitor();
		
		if (!monitor) {
			return;
		}
		if (!producerId && !consumerId) {
			return;
		} else if (producerId && consumerId) {
			return;
		}
		
		let listener: () => void | undefined;
		const storage = monitor.storage;
		
		if (producerId) {
			const producer = mediaService.getProducer(producerId);

			if (producer) {
				listener = () => {
					const trackId = producer.track?.id;

					if (!trackId) {
						return;
					}
					const trackStats = storage.getOutboundTrack(trackId);

					if (!trackStats) {
						return;
					}
					
					const newOutboundStats = createOutboundStats(trackStats);

					setOutboundStats(newOutboundStats);
				};
				monitor.on('stats-collected', listener);
			}
		} else if (consumerId) {
			const consumer = mediaService.getConsumer(consumerId);

			if (consumer) {
				listener = () => {
					const trackId = consumer.track?.id;

					if (!trackId) {
						return;
					}
					const trackStats = storage.getInboundTrack(trackId);

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
	let index = 0;

	return (
		<Stats
			orientation='vertical'
			horizontalPlacement='left'
			verticalPlacement='bottom'
		>
			{inboundStats.map((stats) => {
				return (
					<div key={++index}>
						<b key={++index}>SSRC: {stats.ssrc}</b><br />
						<span key={++index}>receiving: {stats.receivedKbps ?? -1} kbps</span><br />
						<span key={++index}>FractionLoss: {stats.fractionLoss ?? -1}</span><br />
					</div>
				);
			})}
			{outboundStats.map((stats) => {
				return (
					<div key={++index}>
						<b key={++index}>SSRC: {stats.ssrc}</b><br />
						<span key={++index}>sending: {stats.sendingKbps ?? -1} kbps</span><br />
						<span key={++index}>RTT: {stats.RTT ?? -1} ms</span><br />
						<span key={++index}>Fps: {stats.Fps ?? -1}</span><br />
						<br />
						
					</div>
				);
			})}
		</Stats>);
};

export default PeerStatsView;
