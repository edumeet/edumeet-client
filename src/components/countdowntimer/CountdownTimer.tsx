import React, { useRef } from 'react';
import { IconButton, Grid, styled } from '@mui/material';
import { HighlightOff as HighlightOffIcon, Pause as PauseIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import moment from 'moment';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setCountdownTimerInitialTime, startCountdownTimer, stopCountdownTimer } from '../../store/actions/countdownTimerActions';
import { 
	countdownTimerStartLabel, countdownTimerStopLabel }	from '../translated/translatedComponents';
import { isMobileSelector } from '../../store/selectors';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { fullscreenConsumerSelector } from '../../store/selectors';
import 'dayjs/locale/de';

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
	
	const consumer = useAppSelector(fullscreenConsumerSelector);

	return (
		<CountdownTimerDiv>
			<Grid 
				sx={{ flexGrow: '1', justifyContent: 'space-between' }} 
				container wrap='nowrap' 
				alignItems='center' >

				{/*  set */}
				<Grid item xs={8}>
					<LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="de">
						<TimePicker
							label={
								consumer 
									? '' // Hide the label if consumer is empty
									: (isMobile ? 'timer (HH:mm)' : 'timer (HH:mm:ss)')
							}
							
							ampm={false}
							views={[ 'hours', 'minutes', 'seconds' ]}
							defaultValue={moment('2024-12-01T00:00')}
							disabled={!isEnabled || (isStarted && remainingTime !== '00:00:00')}
							onChange={(newValue: moment.Moment | null) => {
								if (newValue)
									dispatch(setCountdownTimerInitialTime(newValue.format('HH:mm:ss')));
							}}
						/>  
					</LocalizationProvider>

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
				{/* <Grid item xs={1}>
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
				</Grid> */}
			</Grid>
		</CountdownTimerDiv>
	);
};

export default CountdownTimer;