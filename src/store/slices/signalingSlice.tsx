import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SignalingConnectionState = 'new' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface SignalingState {
	state: SignalingConnectionState;
	url: string;
	reconnectAttempts: number
}

const initialState: SignalingState = {
	state: 'new',
	url: 'wss://localhost',
	reconnectAttempts: 0
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
			state.reconnectAttempts = 0;
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
		setReconnectAttempts: ((state, action: PayloadAction<number>) => {
			state.reconnectAttempts = action.payload;
		}),

	},
});

export const signalingActions = signalingSlice.actions;
export default signalingSlice;