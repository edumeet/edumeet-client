import React, { useEffect, useRef } from 'react';
import { IconButton, Grid, Switch, TextField, styled } from '@mui/material';
import { HighlightOff as HighlightOffIcon, Pause as PauseIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { intl } from '../../utils/intlManager';
import * as countdownTimerActions from '../../store/actions/countdownTimerActions';
import { countdownTimerActions as countdownTimerSlices } from '../../store/slices/countdownTimerSlice';
import moment from 'moment';
import { 
	countdownTimerStartLabel, countdownTimerStopLabel, countdownTimerPauseLabel, 
	countdownTimerEnableLabel, countdownTimerDisableLabel, countdownTimerSetLabel } 
	from '../translated/translatedComponents';

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
		
		if (isRunning === true) {

			if (_countdownTimerRef === undefined) {
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
			} 
 
			return () => {
				clearInterval(_countdownTimerRef);
			};
		}
	}, [ isRunning, left ]);

	return (
		<Div>
			<Grid 
				sx={{ flexGrow: '1', justifyContent: 'space-between' }} 
				container wrap='nowrap' 
				alignItems='center' >

				{/* TextField  set time */}
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
						onKeyPress={(e) => {
							if (left !== '00:00:00') {
								if (e.key === 'Enter') {
									countdownTimerActions.startCountdownTimer();
									e.preventDefault();
								}
							}
						}}
					/>
				</Grid>

				{/* Button reset time */}
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

				{/* Button start/stop countdown */}
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

				{/* Switch toggle show/hide */}
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
							// dispatch(countdownTimerActions.toggleCountdownTimer(!isEnabled));
							handleFocus();
						}}
						name='checkedB'
						color='error'
						size='small'
					/>
				</Grid>
			</Grid>
		</Div>
	);
};

export default CountdownTimer;