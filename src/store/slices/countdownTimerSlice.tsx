import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CountdownTimerState {
	isEnabled: boolean;
	isStarted: boolean;
	left: string;
}

const initialState : CountdownTimerState = {
	isEnabled: true,
	isStarted: false,
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
		startCountdownTimer: ((state) => {
			state.isStarted = true;
		}),
		stopCountdownTimer: ((state) => {
			state.isStarted = false;
		}),
		setCountdownTimer: ((state, action: PayloadAction<any>) => {
			state.left = action.payload.left;
		}),
	}
});

export const countdownTimerActions = countdownTimerSlice.actions;
export default countdownTimerSlice;