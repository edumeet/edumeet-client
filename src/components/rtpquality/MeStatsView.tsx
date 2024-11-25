import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';
import { TrackStats } from '@observertc/client-monitor-js';

// import { Logger } from '../../utils/Logger';

// const logger = new Logger('MeStatsView');

type OutboundStats = {
	ssrc: number;
	sendingKbps?: number;
	RTT?: number;
	Fps?: number;
	frameWidth? :number;
	frameHeight? :number;
	rid?: string;
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
			frameWidth: stats.frameWidth,
			frameHeight: stats.frameHeight,
			rid: stats.rid,
		};
		
		result.push(item);
	}

	return result;
}

/* eslint-disable */
const MeStatsView = () : JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ outboundStats, setOutboundStats ] = useState<OutboundStats[]>([]);

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.monitor;
		
		if (!monitor) {
			return;
		}
		
		let listener: () => void | undefined;
		const storage = monitor.storage;
		
		if (mediaService.mediaSenders['webcam'].track) {
			listener = () => {

				// Debug
				/*
				for (const outboundRtp of storage.outboundRtps()) {
					const sender = outboundRtp.getSender();
					const trackId = outboundRtp.getTrackId();
					const ssrc = outboundRtp.getSsrc();
					const remoteInboundRtp = outboundRtp.getRemoteInboundRtp();
					const peerConnection = outboundRtp.getPeerConnection();
					const transport = outboundRtp.getTransport();
					const mediaSource = outboundRtp.getMediaSource();
				
					logger.debug(trackId, ssrc,
						outboundRtp.stats,
						remoteInboundRtp?.stats,
						sender?.stats,
						peerConnection.stats,
						transport?.stats,
						mediaSource?.stats
					);
				}
				*/

				const trackId = mediaService.mediaSenders['webcam'].producer?.track?.id;

				if (!trackId) {
					return;
				}
				const trackStats = storage.getTrack(trackId);

				if (!trackStats) {

					return;
				}

				const newOutboundStats = createOutboundStats(trackStats, storage.avgRttInS);

				setOutboundStats(newOutboundStats);
			};
			monitor.on('stats-collected', listener);
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
			{outboundStats.map((stats, index) => {

				return (
					<div key={index + 100010}>
						<b key={index + 1}>SSRC: {stats.ssrc}</b><br />
						<span key={index + 2}>sending: {stats.sendingKbps ?? -1} kbps</span><br />
						<span key={index + 3}>RTT: {stats.RTT ?? -1} ms</span><br />
						<span key={index + 4}>Fps: {stats.Fps ?? -1}</span><br />
						<span key={index + 5}>rid: {stats.rid ?? -1}</span><br />
						<span key={index + 6}>Res: {stats.frameWidth ?? -1}x{stats.frameHeight ?? -1}</span><br />						
						<br />
					</div>
				);
			})}
		</Stats>);
};
export default MeStatsView;