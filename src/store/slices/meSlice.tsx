import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuid } from 'uuid';
import { MediaCapabilities } from '../../services/mediaService';
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
	canRecord: boolean;
	canTranscribe: boolean;
	canShareFiles: boolean;
	devices: MediaDeviceInfo[];
	raisedHand: boolean;
	autoMuted: boolean;
	audioOnly: boolean;
	// Status flags
	audioInProgress: boolean;
	videoInProgress: boolean;
	screenSharingInProgress: boolean;
	displayNameInProgress: boolean;
	raisedHandInProgress: boolean;
	audioOnlyInProgress: boolean;
}

const initialState: MeState = {
	id: uuid(),
	browser: deviceInfo(),
	canSendMic: true,
	canSendWebcam: true,
	canShareScreen: true,
	canShareFiles: false,
	canRecord: false,
	canTranscribe: false,
	devices: [],
	raisedHand: false,
	autoMuted: true,
	audioOnly: false,
	audioInProgress: false,
	videoInProgress: false,
	screenSharingInProgress: false,
	displayNameInProgress: false,
	raisedHandInProgress: false,
	audioOnlyInProgress: false,
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
		setAutoMuted: ((state, action: PayloadAction<boolean>) => {
			state.autoMuted = action.payload;
		}),
		setAudioOnly: ((state, action: PayloadAction<boolean>) => {
			state.audioOnly = action.payload;
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
		setAudioOnlyInProgress: ((state, action: PayloadAction<boolean>) => {
			state.audioOnlyInProgress = action.payload;
		}),
	},
});

export const meActions = meSlice.actions;
export default meSlice;