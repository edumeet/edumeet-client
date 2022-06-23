import { createSlice } from '@reduxjs/toolkit';
import { roomActions } from './roomSlice';

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
	extraReducers: (builder) => {
		builder
			.addCase(roomActions.setState, (state, action) => {
				if (action.payload === 'left')
					state.recording = false;
			});
	}
});

export const recordingActions = recordingSlice.actions;
export default recordingSlice;