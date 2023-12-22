import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';
import { SignalCellularAlt } from '@mui/icons-material';
import { AlertState } from '@observertc/client-monitor-js/lib/ClientMonitor';

const QualityIndicator = (): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ isDistorted, setDistorted ] = useState<boolean>(false);

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.monitor;
		
		if (!monitor) {
			return;
		}
		const listener = (state: AlertState) => setDistorted(state === 'on');

		monitor.on('congestion-alert', listener);

		return () => {
			if (!monitor) {
				return;
			}
			monitor.off('congestion-alert', listener);
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