import React from 'react';
import { Chip } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import moment from 'moment';

const CountdownTimerChip = (): JSX.Element => {
	const isEnabled = useAppSelector((state) => state.countdownTimer.isEnabled);
	const timeLeft = useAppSelector((state) => state.countdownTimer.timeLeft);
	const timeInit = useAppSelector((state) => state.countdownTimer.timeInit);

	const totalTime = moment.duration(timeInit);
	const leftTime = moment.duration(timeLeft);

	const totalSeconds = totalTime.asSeconds();
	const leftSeconds = leftTime.asSeconds();
	const percentage = parseFloat(((leftSeconds / totalSeconds) * 100).toFixed(2));
	let indicatorColor: string;
	const backgroundColor = 'rgba(128, 128, 128, 0.5)'; // Declare the 'backgroundColor' variable here

	switch (true) {
		case percentage <= 100 && percentage >= 50:
			indicatorColor = '#2E7A27';
			break;
		case percentage < 50 && percentage >= 20:
			indicatorColor = '#FFA500';
			break;
		case percentage < 20:
			indicatorColor = 'red';
			break;
		default:
			indicatorColor = backgroundColor;
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
					}}
					label={timeLeft}
					size="small"
					icon={<AvTimerIcon style={{ color: 'white' }} />}
				/>
			)}
		</>
	);
};

export default CountdownTimerChip;