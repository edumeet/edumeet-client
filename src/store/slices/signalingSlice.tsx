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
		reconnecting: ((state) => {
			state.state = 'reconnecting';
		}),
		reconnected: ((state) => {
			state.state = 'connected';
		}),
		// The same connection attempt made again, with every listener left in place.
		retry: ((state) => {
			state.state = 'connecting';
		}),
		disconnect: ((state) => {
			state.state = 'disconnected';
		}),
		setUrl: ((state, action: PayloadAction<string>) => {
			state.url = action.payload;
		}),
	},
});

export const signalingActions = signalingSlice.actions;
export default signalingSlice;