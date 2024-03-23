import React, { useEffect, useRef } from 'react';
import { IconButton, Grid, Switch, TextField, styled } from '@mui/material';
import { HighlightOff as HighlightOffIcon, Pause as PauseIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
// import { intl } from '../../utils/intlManager';
import * as countdownTimerActions from '../../store/actions/countdownTimerActions';
import { countdownTimerActions as countdownTimerSlices } from '../../store/slices/countdownTimerSlice';

import moment from 'moment';

// const styles = (theme) =>
// 	({
// 		root:
// 	{
// 		padding: theme.spacing(1),
// 		display: 'flex',
// 		flexWrap: 'wrap',
// 		marginRight: -theme.spacing(1),
// 		marginTop: -theme.spacing(1)
// 	},
// 		container:
// 	{
// 		marginTop: theme.spacing(1),
// 		marginRight: theme.spacing(2),
// 		flexGrow: '1',
// 		justifyContent: 'space-between'
// 	},
// 		textfield:
// 	{
// 		marginTop: theme.spacing(1),
// 		marginRight: theme.spacing(1),
// 		flexGrow: '1'
// 	},
// 		button:
// 	{
// 		marginTop: theme.spacing(1),
// 		marginRight: theme.spacing(1),
// 		flexGrow: '1'
// 	}

// 	});

interface CountdownTimerProps {
	isEnabled: boolean;
	isRunning: boolean;
	left: string;
	// classes: any;
}

const Div = styled('div')(({ theme }) => ({
	padding: theme.spacing(1),
	display: 'flex',
	flexWrap: 'wrap',
	marginRight: theme.spacing(1),
	marginTop: theme.spacing(1)
}));

const CountdownTimer = () : JSX.Element => {
	// const intl = useIntl();
	const dispatch = useAppDispatch();
	const isEnabled = useAppSelector((state) => state.countdownTimer.isEnabled);
	const isRunning = useAppSelector((state) => state.countdownTimer.isRunning);
	const left = useAppSelector((state) => state.countdownTimer.left);

	const inputRef = useRef<HTMLDivElement>(null);

	const handleFocus = () => {

		if (inputRef.current) {
			inputRef.current.focus();
		}

		const timeout = setTimeout(() => {
			if (inputRef.current) {
				inputRef.current.focus();
			}
		}, 50);

		return () => {
			clearTimeout(timeout);
		};
	};

	let _countdownTimerRef: NodeJS.Timeout;

	useEffect(() => {
		// eslint-disable-next-line no-console
		console.log(isRunning, left);
		
		if (isRunning === true) {

			if (_countdownTimerRef === undefined) 			{
				_countdownTimerRef = setInterval(() => {
					let leftUnix = moment(`1000-01-01 ${left}`).unix();
					const endUnix = moment('1000-01-01 00:00:00').unix();

					leftUnix--;

					const leftString = moment.unix(leftUnix).format('HH:mm:ss');

					dispatch(countdownTimerSlices.setCountdownTimer({ left: leftString }));

					if (leftUnix === endUnix) {
						dispatch(countdownTimerActions.stopCountdownTimer());
					}

				}, 1000);

				// eslint-disable-next-line no-console
				console.log(_countdownTimerRef);
			} 
 
			return () => {
				clearInterval(_countdownTimerRef);
			};
		}
	}, [ isRunning, left ]);
	// }, [ isRunning, left ]);

	return (
		<Div 
			// className={classes.root}
		>
			<Grid
				sx={{
					// marginTop: theme.spacing(1),
					// marginRight: theme.spacing(2),
					flexGrow: '1',
					justifyContent: 'space-between'
				}}
				// className={classes.container}
				container
				wrap='nowrap'
				alignItems='center'
			>
				<Grid item xs={8}>
					{/* TextField  set time */}
					<TextField fullWidth
						// aria-label={intl.formatMessage({
						// 	id: 'set.countdown',
						// 	defaultMessage: 'Set timer'
						// })}
						inputRef={inputRef}
						autoFocus
						sx={{
							// marginTop: theme.spacing(1),
							// marginRight: theme.spacing(1),
							flexGrow: '1'
						}}
						// className={classes.textfield}
						variant='outlined'
						label='timer (hh:mm:ss)'
						disabled={!isEnabled || (isRunning && left !== '00:00:00')}
						type='time'
						value={left}
						size='small'
						InputLabelProps={{
							shrink: true
						}}
						inputProps={{
							step: '1'
						}}
						onChange={(e) => {
							dispatch(countdownTimerActions.setCountdownTimer(e.target.value));
							handleFocus();
						}}
						onKeyPress={(e) => {
							if (left !== '00:00:00') {
								if (e.key === 'Enter') {
									countdownTimerActions.startCountdownTimer();
									e.preventDefault();
								}
							}
						}}
					/>
					{/* /TextField  set time */}
				</Grid>

				<Grid item xs={1}>
					{/* Button reset time */}
					<IconButton
						// aria-label={intl.formatMessage({
						// 	id: 'start.countdown',
						// 	defaultMessage: 'Start'
						// })}
						// className={classes.button}
						sx={{
							// marginTop: theme.spacing(1),
							// marginRight: theme.spacing(1),
							flexGrow: '1'
						}}
						color='error'
						size='small'
						disabled={
							!isEnabled ||
							(
								isRunning ||
								left === '00:00:00'
							)
						}
						onClick={() => {
							dispatch(countdownTimerActions.setCountdownTimer('00:00:00'));
							handleFocus();
						}}
					>
						<HighlightOffIcon />
					</IconButton>
					{/* /Button reset */}
				</Grid>

				{!isRunning ?
					<Grid item xs={1}>
						{/* Button start countdown */}
						<IconButton
							// aria-label={intl.formatMessage({
							// 	id: 'start.countdown',
							// 	defaultMessage: 'Start'
							// })}
							// className={classes.button}
							sx={{
								// marginTop: theme.spacing(1),
								// marginRight: theme.spacing(1),
								flexGrow: '1'
							}}
							color='error'
							size='small'
							disabled={!isEnabled || left === '00:00:00'}
							onClick={() => {
								dispatch(countdownTimerActions.startCountdownTimer());
							}}
						>
							<PlayArrowIcon />
						</IconButton>
						{/* /Button start countdown */}
					</Grid>
					:
					<Grid item xs={1}>
						{/* Button stop countdown */}
						<IconButton 
							// fullWidth
							// aria-label={intl.formatMessage({
							// 	id: 'stop.countdown',
							// 	defaultMessage: 'Stop countdown'
							// })}
							// className={classes.button}
							sx={{
								// marginTop: theme.spacing(1),
								// marginRight: theme.spacing(1),
								flexGrow: '1'
							}}
							color='error'
							size='small'
							disabled={!isEnabled || left === '00:00:00'}
							onClick={() => {
								dispatch(countdownTimerActions.stopCountdownTimer());
								handleFocus();
							}}
						>
							<PauseIcon />
						</IconButton>
						{/* /Button stop countdown */}
					</Grid>
				}
				<Grid item xs={1}>
					{/* Switch toggle show/hide */}
					<Switch
						// className={classes.button}
						sx={{
							// marginTop: theme.spacing(1),
							// marginRight: theme.spacing(1),
							flexGrow: '1'
						}}
						checked={isEnabled}
						disabled={isRunning}
						onChange={() => {
							dispatch(
								isEnabled ? 
									countdownTimerActions.disableCountdownTimer()
									: countdownTimerActions.enableCountdownTimer()
							);
							// dispatch(countdownTimerActions.toggleCountdownTimer(!isEnabled));
							handleFocus();
						}}
						name='checkedB'
						color='error'
						size='small'
					/>
					{/* /Switch toggle show/hide */}
				</Grid>
			</Grid>
		</Div>
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
export default CountdownTimer;