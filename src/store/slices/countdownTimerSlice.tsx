import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CountdownTimerState {
	isEnabled: boolean;
	isStarted: boolean;
	timeSet: string;
	timeLeft: string;
}

const initialState : CountdownTimerState = {
	isEnabled: true,
	isStarted: false,
	timeSet: '00:00:00',
	timeLeft: '00:00:00',
};

const countdownTimerSlice = createSlice({
	name: 'countdownTimer',
	initialState,
	reducers: {
		enableCountdownTimer: ((state) => {
			state.isEnabled = true;
		}),
		disableCountdownTimer: ((state) => {
			state.isEnabled = false;
		}),
		startCountdownTimer: ((state) => {
			state.isStarted = true;
		}),
		stopCountdownTimer: ((state) => {
			state.isStarted = false;
		}),
		setCountdownTimer: ((state, action: PayloadAction<any>) => {
			state.timeLeft = action.payload.timeLeft;
		}),
		setCountdownTimerTimeSet: ((state, action: PayloadAction<any>) => {
			state.timeSet = action.payload.timeSet;
		}),
	}
});

export const countdownTimerActions = countdownTimerSlice.actions;
export default countdownTimerSlice;