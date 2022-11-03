import { ClientMonitorConfig } from '@observertc/client-monitor-js';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';
import { RTCStatsOptions } from '../../utils/types';
import { roomActions } from './roomSlice';

export interface WebrtcState {
	iceServers?: RTCIceServer[];
	rtcStatsOptions?: RTCStatsOptions;
	clientMonitorConfig?: ClientMonitorConfig;
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
		setRTCStatsOptions: ((state, action: PayloadAction<RTCStatsOptions>) => {
			state.rtcStatsOptions = action.payload;
		}),
		setClientMonitorConfig: ((state, action: PayloadAction<ClientMonitorConfig>) => {
			state.clientMonitorConfig = action.payload;
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(roomActions.setState, (state, action) => {
				if (action.payload === 'left') {
					state.iceServers = undefined;
					state.rtpCapabilities = undefined;
					state.torrentSupport = false;
					state.tracker = undefined;
				}
			});
	}
});

export const webrtcActions = webrtcSlice.actions;
export default webrtcSlice;