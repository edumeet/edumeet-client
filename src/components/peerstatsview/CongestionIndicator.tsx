import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';
import { SignalCellularAlt } from '@mui/icons-material';

interface CongestionIndicatorProps {
	peerConnectionLabel?: string;
}

const CongestionIndicator = ({
	peerConnectionLabel,
}: CongestionIndicatorProps): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ congestedTimer, setCongestedTimer ] = useState<ReturnType<typeof setTimeout> | undefined>();

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.getMonitor();
		
		if (!monitor) {
			return;
		}

		const listener: () => void = () => {
			/* eslint-disable no-console */
			console.warn('Congestion detected');
			if (congestedTimer) {
				clearTimeout(congestedTimer);
			}
			setCongestedTimer(setTimeout(() => {
				setCongestedTimer(undefined);
			}, 5000));
		};
		
		monitor.on('congestion-detected', listener);
		
		return () => {
			if (!monitor) {
				return;
			}
			if (listener) {
				monitor.off('congestion-detected', listener);
			}
		};
	}, []);

	return congestedTimer ? (
		<Stats
			orientation='vertical'
			horizontalPlacement='right'
			verticalPlacement='top'
		>
			
			<SignalCellularAlt style={{ color: 'red' }}/>
		</Stats>
	) : (<></>);
};

export default CongestionIndicator;
