import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';

export interface WebrtcState {
	turnServers?: any;
	rtpCapabilities?: RtpCapabilities;
	torrentSupport: boolean;
	tracker?: string;
}

const initialState: WebrtcState = {
	torrentSupport: false,
};

const webrtcSlice = createSlice({
	name: 'webrtc',
	initialState,
	reducers: {
		setTurnServers: ((state, action: PayloadAction<{ turnServers: any }>) => {
			state.turnServers = action.payload.turnServers;
		}),
		setRtpCapabilities: ((
			state,
			action: PayloadAction<{ rtpCapabilities: RtpCapabilities }>
		) => {
			state.rtpCapabilities = action.payload.rtpCapabilities;
		}),
		setTorrentSupport: ((state, action: PayloadAction<{ torrentSupport: boolean }>) => {
			state.torrentSupport = action.payload.torrentSupport;
		}),
		setTracker: ((state, action: PayloadAction<{ tracker: string }>) => {
			state.tracker = action.payload.tracker;
		}),
	},
});

export const webrtcActions = webrtcSlice.actions;
export default webrtcSlice;