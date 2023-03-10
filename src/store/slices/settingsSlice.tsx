import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import edumeetConfig from '../../utils/edumeetConfig';
import { detect } from '../../utils/intlManager';
import { AudioPreset, Resolution, RoomLayout } from '../../utils/types';
import { producersActions } from './producersSlice';

export interface SettingsState {
	displayName?: string;
	lastN: number;
	mirroredSelfView: boolean;
	hideNonVideo: boolean;
	hideSelfView: boolean;
	controlButtonsBar: boolean;
	roomLayout: RoomLayout;
	aspectRatio: number;
	selectedAudioDevice?: string;
	selectedVideoDevice?: string;
	resolution: Resolution;
	frameRate: number;
	screenSharingResolution: Resolution;
	screenSharingFrameRate: number;
	supportedRecorderMimeTypes: string[],
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
	audioMuted?: boolean;
	videoMuted?: boolean;
	locale?: string;
}

type SettingsUpdate = Partial<SettingsState>;

const initialState: SettingsState = {
	mirroredSelfView: true,
	roomLayout: edumeetConfig.defaultLayout,
	resolution: edumeetConfig.resolution,
	frameRate: edumeetConfig.frameRate,
	screenSharingResolution: edumeetConfig.screenSharingResolution,
	screenSharingFrameRate: edumeetConfig.screenSharingFrameRate,
	supportedRecorderMimeTypes: [],
	preferredRecorderMimeType: 'video/webm',
	lastN: edumeetConfig.lastN,
	hideNonVideo: edumeetConfig.hideNonVideo,
	hideSelfView: false,
	controlButtonsBar: false,
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
	locale: detect()
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
		setLastN: ((state, action: PayloadAction<number>) => {
			state.lastN = action.payload;
		}),
		setRoomLayout: ((state, action: PayloadAction<RoomLayout>) => {
			state.roomLayout = action.payload;
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
		setSeparateMediaControls: ((state, action: PayloadAction<boolean>) => {
			state.controlButtonsBar = action.payload;
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
		setSupportedRecorderMimeTypes: ((state, action: PayloadAction<string[]>) => {
			state.supportedRecorderMimeTypes = action.payload;
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
		setAudioMuted: ((state, action: PayloadAction<boolean>) => {
			state.audioMuted = action.payload;
		}),
		setVideoMuted: ((state, action: PayloadAction<boolean>) => {
			state.videoMuted = action.payload;
		}),
		setLocale: ((state, action: PayloadAction<string>) => {
			state.locale = action.payload;
		})
	},
	extraReducers: (builder) => {
		builder
			.addCase(producersActions.closeProducer, (state, action) => {
				const { local, source } = action.payload;

				if (!local) return;

				if (source === 'mic')
					state.audioMuted = true;
				else if (source === 'webcam')
					state.videoMuted = true;
			})
			.addCase(producersActions.setProducerPaused, (state, action) => {
				const { local, source } = action.payload;

				if (!local) return;

				if (source === 'mic')
					state.audioMuted = true;
				else if (source === 'webcam')
					state.videoMuted = true;
			})
			.addCase(producersActions.setProducerResumed, (state, action) => {
				const { local, source } = action.payload;

				if (!local) return;

				if (source === 'mic')
					state.audioMuted = false;
				else if (source === 'webcam')
					state.videoMuted = false;
			});
	}
});

export const settingsActions = settingsSlice.actions;
export default settingsSlice;