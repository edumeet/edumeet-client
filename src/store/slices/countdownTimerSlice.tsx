import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CountdownTimerState {
	isEnabled: boolean;
	isRunning: boolean;
	left: string;
}

const initialState : CountdownTimerState = {
	isEnabled: true,
	isRunning: false,
	left: '00:00:00',
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
		setCountdownTimer: ((state, action: PayloadAction<any>) => {
			state.left = action.payload.left;
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