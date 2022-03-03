import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SignalingState {
	connecting: boolean;
	connected: boolean;
	url: string;
}

const initialState: SignalingState = {
	connecting: false,
	connected: false,
	url: 'wss://localhost',
};

const signalingSlice = createSlice({
	name: 'signaling',
	initialState,
	reducers: {
		connect: ((state) => {
			state.connecting = true;
		}),
		connected: ((state) => {
			state.connected = true;
			state.connecting = false;
		}),
		disconnected: ((state) => {
			state.connected = false;
			state.connecting = false;
		}),
		setUrl: ((state, action: PayloadAction<{ url: string }>) => {
			state.url = action.payload.url;
		}),
	},
});

export const signalingActions = signalingSlice.actions;
export default signalingSlice;