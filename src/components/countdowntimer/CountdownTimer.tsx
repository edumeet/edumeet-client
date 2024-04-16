import React, { useRef } from 'react';
import { IconButton, Grid, Switch, TextField, styled } from '@mui/material';
import { HighlightOff as HighlightOffIcon, Pause as PauseIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import * as countdownTimerActions from '../../store/actions/countdownTimerActions';
import { 
	countdownTimerStartLabel, countdownTimerStopLabel, countdownTimerPauseLabel, 
	countdownTimerEnableLabel, countdownTimerDisableLabel, countdownTimerSetLabel } 
	from '../translated/translatedComponents';

const CountdownTimerDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	marginRight: theme.spacing(1),
	marginTop: theme.spacing(1),
	flexDirection: 'column',
	gap: theme.spacing(1),
}));

const CountdownTimer = () : JSX.Element => {
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

	return (
		<CountdownTimerDiv>
			<Grid 
				sx={{ flexGrow: '1', justifyContent: 'space-between' }} 
				container wrap='nowrap' 
				alignItems='center' >

				{/*  Set */}
				<Grid item xs={8}>
					<TextField fullWidth
						aria-label={countdownTimerSetLabel()}
						inputRef={inputRef}
						autoFocus
						sx={{ flexGrow: '1' }}
						variant='outlined'
						label='timer (hh:mm:ss)'
						disabled={!isEnabled || (isRunning && left !== '00:00:00')}
						type='time'
						value={left}
						size='small'
						InputLabelProps={{ shrink: true }}
						inputProps={{ step: '1' }}
						onChange={(e) => {
							dispatch(countdownTimerActions.setCountdownTimer(e.target.value));
							handleFocus();
						}}
						onKeyDown={(e) => {
							if (left !== '00:00:00') {
								if (e.key === 'Enter') {
									dispatch(countdownTimerActions.startCountdownTimer());
									e.preventDefault();
								}
							}
						}}
					/>
				</Grid>

				{/* Reset */}
				<Grid item xs={1}>
					<IconButton
						aria-label={countdownTimerStartLabel()}
						sx={{ flexGrow: '1' }}
						color='error'
						size='small'
						disabled={ !isEnabled || (isRunning || left === '00:00:00') }
						onClick={() => {
							dispatch(countdownTimerActions.setCountdownTimer('00:00:00'));
							handleFocus();
						}}
					>
						<HighlightOffIcon />
					</IconButton>
				</Grid>

				{/* Start/stop */}
				<Grid item xs={1}>
					<IconButton
						aria-label={ !isRunning ? 
							countdownTimerStartLabel() : 
							countdownTimerStopLabel()
						}
						sx={{ flexGrow: '1' }}
						color='error'
						size='small'
						disabled={!isEnabled || left === '00:00:00'}
						onClick={() => {
							if (!isRunning) {
								dispatch(countdownTimerActions.startCountdownTimer());
							} else {
								dispatch(countdownTimerActions.stopCountdownTimer());
								handleFocus();
							}
						}}
					>
						{!isRunning ? <PlayArrowIcon /> : <PauseIcon /> }
					</IconButton>
				</Grid>

				{/*  enable/disable */}
				<Grid item xs={1}>
					<Switch
						sx={{ flexGrow: '1' }}
						checked={isEnabled}
						disabled={isRunning}
						onChange={() => {
							dispatch(isEnabled ? 
								countdownTimerActions.disableCountdownTimer() : 
								countdownTimerActions.enableCountdownTimer()
							);
							handleFocus();
						}}
						name='checkedB'
						color='error'
						size='small'
					/>
				</Grid>
			</Grid>
		</CountdownTimerDiv>
	);
};

export default CountdownTimer;