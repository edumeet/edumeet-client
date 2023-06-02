import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';
import { SignalCellularAlt, SyncProblem } from '@mui/icons-material';
import { ClientMonitorEvents } from '@observertc/client-monitor-js';

interface QualityIndicatorProps {
	producerId?: string;
	consumerId?: string;
}

const QualityIndicator = ({
	producerId,
	consumerId,
}: QualityIndicatorProps): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ isDistorted, setDistorted ] = useState<boolean>(false);
	const [ isDesync, setDesync ] = useState<boolean>(false);

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.getMonitor();
		
		if (!monitor) {
			return;
		}

		let listener: (alert: ClientMonitorEvents['alerts-changed']) => void | undefined;
		const storage = monitor.storage;

		if (producerId) {
			const producer = mediaService.getProducer(producerId);

			if (producer) {
				listener = (alerts) => {
					const trackId = producer.track?.id;

					/* eslint-disable no-console */
					console.warn('alerts', alerts);

					if (!trackId) {
						return;
					}
					
					const distorted = monitor.alerts['stability-score-alert'].trackIds.includes(trackId);
					
					setDistorted(distorted);
				};
				monitor.on('alerts-changed', listener);
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

					const distorted = monitor.alerts['mean-opinion-score-alert'].trackIds.includes(trackId);
					const desync = monitor.alerts['audio-desync-alert'].trackIds.includes(trackId);
					
					setDistorted(distorted);
					setDesync(desync);
				};
				monitor.on('alerts-changed', listener);
			}
		}

		return () => {
			if (!monitor) {
				return;
			}
			if (listener) {
				monitor.off('alerts-changed', listener);
			}
		};
	}, []);

	return (<div>
		{isDistorted ? (
			<Stats
				orientation='vertical'
				horizontalPlacement='right'
				verticalPlacement='top'
			>
				
				<SignalCellularAlt style={{ color: 'red' }}/>
			</Stats>
		) : (<></>)}
		{isDesync ? (
			<Stats
				orientation='vertical'
				horizontalPlacement='right'
				verticalPlacement='top'
			>
				
				<SyncProblem style={{ color: 'red' }}/>
			</Stats>
		) : (<></>)}
	</div>);
};

export default QualityIndicator;
