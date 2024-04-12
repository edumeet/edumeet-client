import React, { useRef } from 'react';
import { Chip, styled } from '@mui/material';
import { HighlightOff as HighlightOffIcon, Pause as PauseIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
// import { intl } from '../../utils/intlManager';
import * as countdownTimerActions from '../../store/actions/countdownTimerActions';
import { useTheme } from '@mui/material/styles';
import AvTimerIcon from '@mui/icons-material/AvTimer';

// const Div = styled('div')(({ theme }) => ({
// 	padding: theme.spacing(1),
// 	marginRight: theme.spacing(1),
// 	marginTop: theme.spacing(1)
// }));

const CountdownTimerChip = () : JSX.Element => {
	const dispatch = useAppDispatch();
	const isEnabled = useAppSelector((state) => state.countdownTimer.isEnabled);
	// const isRunning = useAppSelector((state) => state.countdownTimer.isRunning);
	const left = useAppSelector((state) => state.countdownTimer.left);
	const theme = useTheme();

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
				icon={<AvTimerIcon color='white'/>}
			/>
			}
		</>
	);
};

// const mapStateToProps = (state) => ({
// 	isEnabled: state.room.countdownTimer.isEnabled,
// 	isRunning: state.room.countdownTimer.isRunning,
// 	left: state.room.countdownTimer.left
// });

// export default withRoomContext(connect(
// 	mapStateToProps,
// 	null,
// 	null,
// 	{
// 		areStatesEqual: (next, prev) => {
// 			return (
// 				prev.isEnabled === next.room.countdownTimer.isEnabled,
// 				prev.isRunning === next.room.countdownTimer.isRunning,
// 				prev.left === next.room.countdownTimer.left
// 			);
// 		}
// 	}
// )(withStyles(styles)(CountdownTimer)));
export default CountdownTimerChip;