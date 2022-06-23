import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SignalingConnectionState = 'new' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface SignalingState {
	state: SignalingConnectionState;
	url: string;
}

const initialState: SignalingState = {
	state: 'new',
	url: 'wss://localhost',
};

const signalingSlice = createSlice({
	name: 'signaling',
	initialState,
	reducers: {
		connect: ((state) => {
			state.state = 'connecting';
		}),
		connected: ((state) => {
			state.state = 'connected';
		}),
		disconnect: ((state) => {
			state.state = 'disconnected';
		}),
		reconnecting: ((state) => {
			state.state = 'reconnecting';
		}),
		setUrl: ((state, action: PayloadAction<string>) => {
			state.url = action.payload;
		}),
	},
});

export const signalingActions = signalingSlice.actions;
export default signalingSlice;