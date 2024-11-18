import React, { useRef } from 'react';
import { IconButton, Grid, Switch, TextField, styled } from '@mui/material';
import { HighlightOff as HighlightOffIcon, Pause as PauseIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import moment from 'moment';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setCountdownTimerInitialTime, startCountdownTimer, stopCountdownTimer, disableCountdownTimer, enableCountdownTimer } from '../../store/actions/countdownTimerActions';
import { 
	countdownTimerStartLabel, countdownTimerStopLabel, 
	countdownTimerEnableLabel, countdownTimerDisableLabel, countdownTimerSetLabel } 
	from '../translated/translatedComponents';
import { isMobileSelector } from '../../store/selectors';

const CountdownTimerDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	marginRight: theme.spacing(1),
	marginTop: theme.spacing(1),
	flexDirection: 'column',
	gap: theme.spacing(1),
}));

const CountdownTimer = () : JSX.Element => {
	const isMobile = useAppSelector(isMobileSelector);
	const dispatch = useAppDispatch();
	const isEnabled = useAppSelector((state) => state.room.countdownTimer.isEnabled);
	const isStarted = useAppSelector((state) => state.room.countdownTimer.isStarted);
	const remainingTime = useAppSelector((state) => state.room.countdownTimer.remainingTime);

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

				{/*  set */}
				<Grid item xs={8}>
					<TextField fullWidth
						aria-label={countdownTimerSetLabel()}
						inputRef={inputRef}
						autoFocus={!isMobile}
						sx={{ flexGrow: '1' }}
						variant='outlined'
						label={(isMobile) ? 'timer (HH:mm)' : 'timer (HH:mm:ss)'}
						disabled={!isEnabled || (isStarted && remainingTime !== '00:00:00')}
						type='time'
						value={remainingTime}
						size='small'
						InputLabelProps={{ shrink: true }}
						inputProps={{ step: '1' }}
						onChange={(e) => {
							const time = (isMobile && moment(e.target.value, 'HH:mm', true).isValid())
								? moment(`${e.target.value}:00`, 'HH:mm:ss').format('HH:mm:ss')
								: moment(`${e.target.value}`, 'HH:mm:ss').format('HH:mm:ss');
							
							dispatch(setCountdownTimerInitialTime(time));
						}}
						onKeyDown={(e) => {
							if (remainingTime !== '00:00:00') {
								if (e.key === 'Enter') {
									dispatch(startCountdownTimer());
									e.preventDefault();
								}
							}
						}}
					/>
				</Grid>

				{/* reset */}
				<Grid item xs={1}>
					<IconButton
						aria-label={countdownTimerStartLabel()}
						sx={{ flexGrow: '1' }}
						color='error'
						size='small'
						disabled={ !isEnabled || (isStarted || remainingTime === '00:00:00') }
						onClick={() => {
							dispatch(setCountdownTimerInitialTime('00:00:00'));
						}}
					>
						<HighlightOffIcon />
					</IconButton>
				</Grid>

				{/* start/stop */}
				<Grid item xs={1}>
					<IconButton
						aria-label={ !isStarted ? 
							countdownTimerStartLabel() : 
							countdownTimerStopLabel()
						}
						sx={{ flexGrow: '1' }}
						color='error'
						size='small'
						disabled={!isEnabled || remainingTime === '00:00:00'}
						onClick={() => {
							if (!isStarted) {
								dispatch(startCountdownTimer());
							} else {
								dispatch(stopCountdownTimer());
								handleFocus();
							}
						}}
					>
						{!isStarted ? <PlayArrowIcon /> : <PauseIcon /> }
					</IconButton>
				</Grid>

				{/*  enable/disable */}
				<Grid item xs={1}>
					<Switch
						aria-label={ !isStarted ? 
							countdownTimerDisableLabel() : 
							countdownTimerEnableLabel()
						}
						sx={{ flexGrow: '1' }}
						checked={isEnabled}
						disabled={isStarted}
						onChange={() => {
							dispatch(isEnabled ? 
								disableCountdownTimer() : 
								enableCountdownTimer()
							);
						}}
						color='error'
						size='small'
					/>
				</Grid>
			</Grid>
		</CountdownTimerDiv>
	);
};

export default CountdownTimer;