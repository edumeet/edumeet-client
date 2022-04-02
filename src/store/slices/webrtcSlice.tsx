import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';

export interface WebrtcState {
	iceServers?: RTCIceServer[];
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
		setIceServers: ((state, action: PayloadAction<RTCIceServer[]>) => {
			state.iceServers = action.payload;
		}),
		setRtpCapabilities: ((
			state,
			action: PayloadAction<RtpCapabilities>
		) => {
			state.rtpCapabilities = action.payload;
		}),
		setTorrentSupport: ((state, action: PayloadAction<boolean>) => {
			state.torrentSupport = action.payload;
		}),
		setTracker: ((state, action: PayloadAction<string>) => {
			state.tracker = action.payload;
		}),
	},
});

export const webrtcActions = webrtcSlice.actions;
export default webrtcSlice;