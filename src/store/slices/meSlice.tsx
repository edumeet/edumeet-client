import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuid } from 'uuid';
import { deviceInfo, DeviceInfo } from '../../utils/deviceInfo';

export interface MeState {
	id: string;
	browser: Omit<DeviceInfo, 'bowser'>;
	picture?: string;
	canSendMic: boolean;
	canSendWebcam: boolean;
	canShareScreen: boolean;
	canShareFiles: boolean;
	audioDevices?: undefined;
	webcamDevices?: undefined;
	raisedHand: boolean;
	speaking: boolean;
	autoMuted: boolean;
	// Status flags
	audioInProgress: boolean;
	webcamInProgress: boolean;
	screenShareInProgress: boolean;
	displayNameInProgress: boolean;
	raisedHandInProgress: boolean;
}

const initialState: MeState = {
	id: uuid(),
	browser: deviceInfo(),
	canSendMic: false,
	canSendWebcam: false,
	canShareScreen: false,
	canShareFiles: false,

	/* audioDevices: undefined,
	webcamDevices: undefined, */

	raisedHand: false,
	speaking: false,
	autoMuted: true,
	audioInProgress: false,
	webcamInProgress: false,
	screenShareInProgress: false,
	displayNameInProgress: false,
	raisedHandInProgress: false,
};

const meSlice = createSlice({
	name: 'me',
	initialState,
	reducers: {
		setMe: ((state, action: PayloadAction<{ peerId: string }>) => {
			state.id = action.payload.peerId;
		}),
		setPicture: ((state, action: PayloadAction<{ picture: string }>) => {
			state.picture = action.payload.picture;
		}),
		setMediaCapabilities: ((
			state,
			action: PayloadAction<{
				canSendMic: boolean,
				canSendWebcam: boolean,
				canShareScreen: boolean,
				canShareFiles: boolean,
			}>
		) => {
			state.canSendMic = action.payload.canSendMic;
			state.canSendWebcam = action.payload.canSendWebcam;
			state.canShareScreen = action.payload.canShareScreen;
			state.canShareFiles = action.payload.canShareFiles;
		}),
		setRaisedHand: ((state, action: PayloadAction<{ raisedHand: boolean }>) => {
			state.raisedHand = action.payload.raisedHand;
		}),
		setSpeaking: ((state, action: PayloadAction<{ speaking: boolean }>) => {
			state.speaking = action.payload.speaking;
		}),
		setAutoMuted: ((state, action: PayloadAction<{ autoMuted: boolean }>) => {
			state.autoMuted = action.payload.autoMuted;
		}),
		// Status flags
		setAudioInProgress: ((state, action: PayloadAction<{ audioInProgress: boolean }>) => {
			state.audioInProgress = action.payload.audioInProgress;
		}),
		setWebcamInProgress: ((
			state,
			action: PayloadAction<{ webcamInProgress: boolean }>
		) => {
			state.webcamInProgress = action.payload.webcamInProgress;
		}),
		setScreenShareInProgress: ((
			state,
			action: PayloadAction<{ screenShareInProgress: boolean }>
		) => {
			state.screenShareInProgress = action.payload.screenShareInProgress;
		}),
		setRaiseHandInProgress: ((
			state,
			action: PayloadAction<{ raisedHandInProgress: boolean }>
		) => {
			state.raisedHandInProgress = action.payload.raisedHandInProgress;
		}),
		setDispayNameInProgress: ((
			state,
			action: PayloadAction<{ displayNameInProgress: boolean }>
		) => {
			state.displayNameInProgress = action.payload.displayNameInProgress;
		}),
	},
});

export const meActions = meSlice.actions;
export default meSlice;