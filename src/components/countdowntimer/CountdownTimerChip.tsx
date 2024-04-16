import React from 'react';
import { Chip } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import AvTimerIcon from '@mui/icons-material/AvTimer';

const CountdownTimerChip = () : JSX.Element => {
	const isEnabled = useAppSelector((state) => state.countdownTimer.isEnabled);
	const left = useAppSelector((state) => state.countdownTimer.left);

	return (
		<>
			{ isEnabled &&
			<Chip
				sx={{
					color: 'white',
					backgroundColor: 'rgba(128, 128, 128, 0.5)',
				}}
				label={left}
				size='small'
				icon={<AvTimerIcon style={{ color: 'white' }}/>}
			/>
			}
		</>
	);
};

export default CountdownTimerChip;