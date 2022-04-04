import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import edumeetConfig from '../../utils/edumeetConfig';

export interface SettingsState {
	displayName?: string;
	advancedMode?: boolean;
	drawerOverlayed: boolean;
	permanentTopBar: boolean;
	lastN: number;
	hideNonVideo: boolean;
	aspectRatio: number;
	selectedAudioDevice?: string;
	selectedVideoDevice?: string;
	resolution: string;
	frameRate: number;
	screenSharingResolution: string;
	screenSharingFrameRate: number;
	autoGainControl: boolean;
	echoCancellation: boolean;
	noiseSuppression: boolean;
	sampleRate: number;
	channelCount: number;
	sampleSize: number;
	opusStereo: boolean;
	opusDtx: boolean;
	opusFec: boolean;
	opusPtime: number;
	opusMaxPlaybackRate: number;
	audioMuted?: boolean;
	videoMuted?: boolean;
}

const initialState: SettingsState = {
	drawerOverlayed: edumeetConfig.drawerOverlayed,
	resolution: edumeetConfig.resolution,
	frameRate: edumeetConfig.frameRate,
	screenSharingResolution: edumeetConfig.screenSharingResolution,
	screenSharingFrameRate: edumeetConfig.screenSharingFrameRate,
	permanentTopBar: true,
	lastN: edumeetConfig.lastN,
	hideNonVideo: edumeetConfig.hideNonVideo,
	aspectRatio: edumeetConfig.aspectRatio,
	autoGainControl: edumeetConfig.autoGainControl,
	echoCancellation: edumeetConfig.echoCancellation,
	noiseSuppression: edumeetConfig.noiseSuppression,
	sampleRate: edumeetConfig.sampleRate,
	channelCount: edumeetConfig.channelCount,
	sampleSize: edumeetConfig.sampleSize,
	opusStereo: edumeetConfig.opusStereo,
	opusDtx: edumeetConfig.opusDtx,
	opusFec: edumeetConfig.opusFec,
	opusPtime: edumeetConfig.opusPtime,
	opusMaxPlaybackRate: edumeetConfig.opusMaxPlaybackRate,
};

const settingsSlice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		setDisplayName: ((state, action: PayloadAction<string>) => {
			state.displayName = action.payload;
		}),
		toggleAdvancedMode: ((state) => {
			state.advancedMode = !state.advancedMode;
		}),
		toggleDrawerOverlayed: ((state) => {
			state.drawerOverlayed = !state.drawerOverlayed;
		}),
		togglePermanentTopBar: ((state) => {
			state.permanentTopBar = !state.permanentTopBar;
		}),
		setLastN: ((state, action: PayloadAction<number>) => {
			state.lastN = action.payload;
		}),
		setHideNonVideo: ((state, action: PayloadAction<boolean>) => {
			state.hideNonVideo = action.payload;
		}),
		setAspectRatio: ((state, action: PayloadAction<number>) => {
			state.aspectRatio = action.payload;
		}),
		setSelectedAudioDevice: ((state, action: PayloadAction<string | undefined>) => {
			state.selectedAudioDevice = action.payload;
		}),
		setSelectedVideoDevice: ((state, action: PayloadAction<string | undefined>) => {
			state.selectedVideoDevice = action.payload;
		}),
		setResolution: ((state, action: PayloadAction<string>) => {
			state.resolution = action.payload;
		}),
		setFrameRate: ((state, action: PayloadAction<number>) => {
			state.frameRate = action.payload;
		}),
		setScreenSharingResolution: ((state, action: PayloadAction<string>) => {
			state.screenSharingResolution = action.payload;
		}),
		setScreenSharingFrameRate: ((state, action: PayloadAction<number>) => {
			state.screenSharingFrameRate = action.payload;
		}),
		setAutoGainControl: ((state, action: PayloadAction<boolean>) => {
			state.autoGainControl = action.payload;
		}),
		setEchoCancellation: ((state, action: PayloadAction<boolean>) => {
			state.echoCancellation = action.payload;
		}),
		setNoiseSuppression: ((state, action: PayloadAction<boolean>) => {
			state.noiseSuppression = action.payload;
		}),
		setSampleRate: ((state, action: PayloadAction<number>) => {
			state.sampleRate = action.payload;
		}),
		setChannelCount: ((state, action: PayloadAction<number>) => {
			state.channelCount = action.payload;
		}),
		setSampleSize: ((state, action: PayloadAction<number>) => {
			state.sampleSize = action.payload;
		}),
		setOpusStereo: ((state, action: PayloadAction<boolean>) => {
			state.opusStereo = action.payload;
		}),
		setOpusDtx: ((state, action: PayloadAction<boolean>) => {
			state.opusDtx = action.payload;
		}),
		setOpusFec: ((state, action: PayloadAction<boolean>) => {
			state.opusFec = action.payload;
		}),
		setOpusPtime: ((state, action: PayloadAction<number>) => {
			state.opusPtime = action.payload;
		}),
		setOpusMaxPlaybackRate: ((state, action: PayloadAction<number>) => {
			state.opusMaxPlaybackRate = action.payload;
		}),
		setAudioMuted: ((state, action: PayloadAction<boolean>) => {
			state.audioMuted = action.payload;
		}),
		setVideoMuted: ((state, action: PayloadAction<boolean>) => {
			state.videoMuted = action.payload;
		}),
	},
});

export const settingsActions = settingsSlice.actions;
export default settingsSlice;