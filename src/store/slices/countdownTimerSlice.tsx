import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CountdownTimerState {
	isEnabled: boolean;
	isStarted: boolean;
	initialTime: string;
	remainingTime: string;
}

const initialState : CountdownTimerState = {
	isEnabled: true,
	isStarted: false,
	initialTime: '00:00:00',
	remainingTime: '00:00:00',
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
		setCountdownTimerRemainingTime: ((state, action: PayloadAction<any>) => {
			
			const time = action.payload;

			state.remainingTime = time;
		}),
		setCountdownTimerInitialTime: ((state, action: PayloadAction<any>) => {

			const time = action.payload;
			
			state.initialTime = time;
		}),
		finishCountdownTimer: ((state, action: PayloadAction<any>) => {

			state.isStarted = action.payload.isStarted;
			state.remainingTime = action.payload.remainingTime;
		}),
		joinCountdownTimer: ((state, action: PayloadAction<any>) => {
			state.initialTime = action.payload.initialTime;
			state.remainingTime = action.payload.remainingTime;
		}),
	}
});

export const countdownTimerActions = countdownTimerSlice.actions;
export default countdownTimerSlice;