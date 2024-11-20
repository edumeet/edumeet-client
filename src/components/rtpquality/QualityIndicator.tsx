import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';
import { SignalCellularAlt } from '@mui/icons-material';
import { ClientMonitor } from '@observertc/client-monitor-js/lib/ClientMonitor';

const QualityIndicator = (): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ isDistorted, setDistorted ] = useState<boolean>(false);

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.monitor as ClientMonitor;
		
		if (!monitor) {
			return;
		}

		const detector = monitor.createCongestionDetector();

		detector.on('alert-state', (state) => setDistorted(state === 'on'));

		return () => {
			if (!monitor) {
				return;
			}
			detector.on('alert-state', (state) => setDistorted(state === 'on'));
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
	</div>);
};

export default QualityIndicator;