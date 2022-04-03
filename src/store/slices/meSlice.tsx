import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuid } from 'uuid';
import { deviceInfo, DeviceInfo } from '../../utils/deviceInfo';

export interface MeState {
	id: string;
	browser: Omit<DeviceInfo, 'bowser'>;
	picture?: string;
	previewWebcamTrackId?: string;
	previewMicTrackId?: string;
	canSendMic: boolean;
	canSendWebcam: boolean;
	canShareScreen: boolean;
	canShareFiles: boolean;
	devices: MediaDeviceInfo[];
	raisedHand: boolean;
	speaking: boolean;
	autoMuted: boolean;
	// Status flags
	audioInProgress: boolean;
	videoInProgress: boolean;
	screenSharingInProgress: boolean;
	displayNameInProgress: boolean;
	raisedHandInProgress: boolean;
}

const initialState: MeState = {
	id: uuid(),
	browser: deviceInfo(),
	canSendMic: true,
	canSendWebcam: true,
	canShareScreen: true,
	canShareFiles: false,
	devices: [],
	raisedHand: false,
	speaking: false,
	autoMuted: true,
	audioInProgress: false,
	videoInProgress: false,
	screenSharingInProgress: false,
	displayNameInProgress: false,
	raisedHandInProgress: false,
};

const meSlice = createSlice({
	name: 'me',
	initialState,
	reducers: {
		setMe: ((state, action: PayloadAction<string>) => {
			state.id = action.payload;
		}),
		setPicture: ((state, action: PayloadAction<string>) => {
			state.picture = action.payload;
		}),
		setPreviewWebcamTrackId: ((state, action: PayloadAction<string | undefined>) => {
			state.previewWebcamTrackId = action.payload;
		}),
		setPreviewMicTrackId: ((state, action: PayloadAction<string | undefined>) => {
			state.previewMicTrackId = action.payload;
		}),
		setMediaCapabilities: ((
			state,
			action: PayloadAction<{
				canSendMic?: boolean,
				canSendWebcam?: boolean,
				canShareScreen?: boolean,
				canShareFiles?: boolean,
			}>
		) => {
			return { ...state, ...action.payload };
		}),
		setDevices: ((state, action: PayloadAction<MediaDeviceInfo[]>) => {
			state.devices = action.payload;
		}),
		setRaisedHand: ((state, action: PayloadAction<boolean>) => {
			state.raisedHand = action.payload;
		}),
		setSpeaking: ((state, action: PayloadAction<boolean>) => {
			state.speaking = action.payload;
		}),
		setAutoMuted: ((state, action: PayloadAction<boolean>) => {
			state.autoMuted = action.payload;
		}),
		// Status flags
		setAudioInProgress: ((state, action: PayloadAction<boolean>) => {
			state.audioInProgress = action.payload;
		}),
		setVideoInProgress: ((state, action: PayloadAction<boolean>) => {
			state.videoInProgress = action.payload;
		}),
		setScreenSharingInProgress: ((state, action: PayloadAction<boolean>) => {
			state.screenSharingInProgress = action.payload;
		}),
		setRaiseHandInProgress: ((state, action: PayloadAction<boolean>) => {
			state.raisedHandInProgress = action.payload;
		}),
		setDispayNameInProgress: ((state, action: PayloadAction<boolean>) => {
			state.displayNameInProgress = action.payload;
		}),
	},
});

export const meActions = meSlice.actions;
export default meSlice;