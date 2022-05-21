import { createSlice } from '@reduxjs/toolkit';

export interface RecordingState {
	recording: boolean;
}

const initialState: RecordingState = {
	recording: false,
};

const recordingSlice = createSlice({
	name: 'recording',
	initialState,
	reducers: {
		start: ((state) => {
			state.recording = true;
		}),
		stop: ((state) => {
			state.recording = false;
		}),
	},
});

export const recordingActions = recordingSlice.actions;
export default recordingSlice;