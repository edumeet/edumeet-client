import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuid } from 'uuid';
import { MediaCapabilities } from '../../services/mediaService';
import { deviceInfo, DeviceInfo } from '../../utils/deviceInfo';

export interface MeState {
	id: string;
	sessionId: string;
	browser: Omit<DeviceInfo, 'bowser'>;
	picture?: string;
	canSendMic: boolean;
	canSendWebcam: boolean;
	canShareScreen: boolean;
	canRecord: boolean;
	canTranscribe: boolean;
	canBlurBackground: boolean;
	canShareFiles: boolean;
	canSelectAudioOutput: boolean
	devices: MediaDeviceInfo[];
	raisedHand: boolean;
	escapeMeeting: boolean;
	autoMuted: boolean;
	// Status flags
	screenSharingInProgress: boolean;
	displayNameInProgress: boolean;
	raisedHandInProgress: boolean;
	escapeMeetingInProgress: boolean;
}

const initialState: MeState = {
	id: uuid(),
	sessionId: 'temp',
	browser: deviceInfo(),
	canSendMic: true,
	canSendWebcam: true,
	canShareScreen: true,
	canShareFiles: false,
	canRecord: false,
	canTranscribe: false,
	canBlurBackground: true,
	canSelectAudioOutput: ('sinkId' in HTMLMediaElement.prototype),
	devices: [],
	raisedHand: false,
	escapeMeeting: false,
	autoMuted: true,
	screenSharingInProgress: false,
	displayNameInProgress: false,
	raisedHandInProgress: false,
	escapeMeetingInProgress: false,
};

const meSlice = createSlice({
	name: 'me',
	initialState,
	reducers: {
		setMe: ((state, action: PayloadAction<string>) => {
			state.id = action.payload;
		}),
		setSessionId: ((state, action: PayloadAction<string>) => {
			state.sessionId = action.payload;
		}),
		setPicture: ((state, action: PayloadAction<string>) => {
			state.picture = action.payload;
		}),
		setMediaCapabilities: ((
			state,
			action: PayloadAction<MediaCapabilities>
		) => {
			return { ...state, ...action.payload };
		}),
		setDevices: ((state, action: PayloadAction<MediaDeviceInfo[]>) => {
			state.devices = action.payload;
		}),
		setRaisedHand: ((state, action: PayloadAction<boolean>) => {
			state.raisedHand = action.payload;
		}),
		setEscapeMeeting: ((state, action: PayloadAction<boolean>) => {
			state.escapeMeeting = action.payload;
		}),
		setAutoMuted: ((state, action: PayloadAction<boolean>) => {
			state.autoMuted = action.payload;
		}),
		// Status flags
		setScreenSharingInProgress: ((state, action: PayloadAction<boolean>) => {
			state.screenSharingInProgress = action.payload;
		}),
		setRaiseHandInProgress: ((state, action: PayloadAction<boolean>) => {
			state.raisedHandInProgress = action.payload;
		}),
		setEscapeMeetingInProgress: ((state, action: PayloadAction<boolean>) => {
			state.escapeMeetingInProgress = action.payload;
		}),
		setDispayNameInProgress: ((state, action: PayloadAction<boolean>) => {
			state.displayNameInProgress = action.payload;
		}),
		setCanBlurBackground: ((state, action: PayloadAction<boolean>) => {
			state.canBlurBackground = action.payload;
		}),
	},
});

export const meActions = meSlice.actions;
export default meSlice;