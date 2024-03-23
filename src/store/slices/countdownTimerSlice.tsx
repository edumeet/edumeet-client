import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CountdownTimerState {
	isEnabled: boolean,
	left: string,
	isRunning: boolean
}

const initialState : CountdownTimerState = {
	isEnabled: true,
	left: '00:00:00',
	isRunning: false
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
		// toggleCountdownTimer: ((state, action: PayloadAction<any>) => {
		// 	state.isEnabled = action.payload;
		// }),
		setCountdownTimer: ((state, action: PayloadAction<any>) => {
			state.left = action.payload.left;
			// state.isRunning = action.payload.isRunning;
		}),
		startCountdownTimer: ((state) => {
			state.isRunning = true;
		}),
		stopCountdownTimer: ((state) => {
			state.isRunning = false;
		}),
	}
});

export const countdownTimerActions = countdownTimerSlice.actions;
export default countdownTimerSlice;