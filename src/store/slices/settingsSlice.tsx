import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import edumeetConfig from '../../utils/edumeetConfig';
import { detect } from '../../utils/intlManager';
import { AudioPreset, Resolution } from '../../utils/types';

export interface SettingsState {
	displayName: string;
	maxActiveVideos: number;
	mirroredSelfView: boolean;
	hideNonVideo: boolean;
	hideSelfView: boolean;
	verticalDivide: boolean;
	aspectRatio: number;
	selectedAudioDevice?: string;
	selectedAudioOutputDevice?: string;
	selectedVideoDevice?: string;
	resolution: Resolution;
	frameRate: number;
	screenSharingResolution: Resolution;
	screenSharingFrameRate: number;
	preferredRecorderMimeType: string,
	audioPreset: string,
	audioPresets: Record<string, AudioPreset>,
	autoGainControl: boolean;
	echoCancellation: boolean;
	noiseSuppression: boolean;
	noiseThreshold: number;
	sampleRate: number;
	channelCount: number;
	sampleSize: number;
	opusStereo: boolean;
	opusDtx: boolean;
	opusFec: boolean;
	opusPtime: number;
	opusMaxPlaybackRate: number;
	notificationSounds: boolean;
	locale?: string;
	videoContainEnabled?: boolean;
}

type SettingsUpdate = Partial<SettingsState>;

const initialState: SettingsState = {
	displayName: 'Guest',
	mirroredSelfView: true,
	resolution: edumeetConfig.resolution,
	frameRate: edumeetConfig.frameRate,
	screenSharingResolution: edumeetConfig.screenSharingResolution,
	screenSharingFrameRate: edumeetConfig.screenSharingFrameRate,
	preferredRecorderMimeType: 'video/webm',
	maxActiveVideos: 12,
	hideNonVideo: edumeetConfig.hideNonVideo,
	hideSelfView: false,
	verticalDivide: true,
	aspectRatio: edumeetConfig.aspectRatio,
	audioPreset: edumeetConfig.audioPreset,
	audioPresets: edumeetConfig.audioPresets,
	autoGainControl: edumeetConfig.autoGainControl,
	echoCancellation: edumeetConfig.echoCancellation,
	noiseSuppression: edumeetConfig.noiseSuppression,
	noiseThreshold: edumeetConfig.noiseThreshold,
	sampleRate: edumeetConfig.sampleRate,
	channelCount: edumeetConfig.channelCount,
	sampleSize: edumeetConfig.sampleSize,
	opusStereo: edumeetConfig.opusStereo,
	opusDtx: edumeetConfig.opusDtx,
	opusFec: edumeetConfig.opusFec,
	opusPtime: edumeetConfig.opusPtime,
	opusMaxPlaybackRate: edumeetConfig.opusMaxPlaybackRate,
	notificationSounds: true,
	locale: detect(),
};

const settingsSlice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		updateSettings: ((state, action: PayloadAction<SettingsUpdate>) => {
			return { ...state, ...action.payload };
		}),
		setDisplayName: ((state, action: PayloadAction<string>) => {
			state.displayName = action.payload;
		}),
		setMaxActiveVideos: ((state, action: PayloadAction<number>) => {
			state.maxActiveVideos = action.payload;
		}),
		setMirroredSelfView: ((state, action: PayloadAction<boolean>) => {
			state.mirroredSelfView = action.payload;
		}),
		setHideNonVideo: ((state, action: PayloadAction<boolean>) => {
			state.hideNonVideo = action.payload;
		}),
		setHideSelfView: ((state, action: PayloadAction<boolean>) => {
			state.hideSelfView = action.payload;
		}),
		setVerticalDivide: ((state, action: PayloadAction<boolean>) => {
			state.verticalDivide = action.payload;
		}),
		setAspectRatio: ((state, action: PayloadAction<number>) => {
			state.aspectRatio = action.payload;
		}),
		setSelectedAudioDevice: ((state, action: PayloadAction<string | undefined>) => {
			state.selectedAudioDevice = action.payload;
		}),
		setSelectedAudioOutputDevice: ((state, action: PayloadAction<string | undefined>) => {
			state.selectedAudioOutputDevice = action.payload;
		}),
		setSelectedVideoDevice: ((state, action: PayloadAction<string | undefined>) => {
			state.selectedVideoDevice = action.payload;
		}),
		setResolution: ((state, action: PayloadAction<Resolution>) => {
			state.resolution = action.payload;
		}),
		setFrameRate: ((state, action: PayloadAction<number>) => {
			state.frameRate = action.payload;
		}),
		setScreenSharingResolution: ((state, action: PayloadAction<Resolution>) => {
			state.screenSharingResolution = action.payload;
		}),
		setScreenSharingFrameRate: ((state, action: PayloadAction<number>) => {
			state.screenSharingFrameRate = action.payload;
		}),
		setPreferredRecorderMimeType: ((state, action: PayloadAction<string>) => {
			state.preferredRecorderMimeType = action.payload;
		}),
		setAudioPreset: ((state, action: PayloadAction<string>) => {
			state.audioPreset = action.payload;
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
		setNoiseThreshold: ((state, action: PayloadAction<number>) => {
			state.noiseThreshold = action.payload;
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
		setNotificationSounds: ((state, action: PayloadAction<boolean>) => {
			state.notificationSounds = action.payload;
		}),
		setLocale: ((state, action: PayloadAction<string>) => {
			state.locale = action.payload;
		}),
		setVideoContainEnabled: ((state, action: PayloadAction<boolean>) => {
			state.videoContainEnabled = action.payload;
		}),
	},
});

export const settingsActions = settingsSlice.actions;
export default settingsSlice;
