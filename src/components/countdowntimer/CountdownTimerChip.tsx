import React from 'react';
import { Chip } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import moment from 'moment';

const CountdownTimerChip = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const isEnabled = useAppSelector((state) => state.room.countdownTimer.isEnabled);
	const remainingTime = useAppSelector((state) => state.room.countdownTimer.remainingTime);
	const initialTime = useAppSelector((state) => state.room.countdownTimer.initialTime);

	const participantListOpen = useAppSelector((state) => state.ui.participantListOpen);

	const openUsersTab = () => dispatch(uiActions.setUi({ participantListOpen: !participantListOpen }));

	const secondsSet = moment.duration(initialTime).asSeconds();
	const secondsLeft = moment.duration(remainingTime).asSeconds();
	const percentage = parseFloat(((secondsLeft / secondsSet) * 100).toFixed(2));

	let indicatorColor: string;
	const backgroundColor: string = 'rgba(128, 128, 128, 0.5)'; // Declare the 'backgroundColor' variable here

	switch (true) {
		case percentage <= 100 && percentage >= 50: indicatorColor = '#2E7A27'; break;
		case percentage < 	50 && percentage >= 20: indicatorColor = '#FFA500'; break;
		case percentage < 	20: 					indicatorColor = '#FF0000'; break;
		default: indicatorColor = backgroundColor;
	}

	return (
		<>
			{isEnabled && (
				<Chip
					sx={{
						color: 'white',
						backgroundColor: backgroundColor,
						background: `linear-gradient(to right, ${indicatorColor} ${percentage}%, ${backgroundColor} ${percentage}%)`,
						animation: `${percentage}% blink-animation 1s infinite`,
						width: '86px',
					}}
					label={remainingTime}
					size="small"
					icon={<AvTimerIcon style={{ color: 'white' }} />}
					onClick={() => openUsersTab()}
				/>
			)}
		</>
	);
};

export default CountdownTimerChip;