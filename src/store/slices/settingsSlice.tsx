import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import edumeetConfig from '../../utils/edumeetConfig';

export interface SettingsState {
	displayName?: string;
	advancedMode?: boolean;
	drawerOverlayed: boolean;
	permanentTopBar: boolean;
	aspectRatio: number;
	selectedAudioDevice?: string;
	selectedVideoDevice?: string;
	resolution: string;
	frameRate: number;
}

const initialState: SettingsState = {
	drawerOverlayed: edumeetConfig.drawerOverlayed,
	resolution: edumeetConfig.resolution,
	frameRate: edumeetConfig.frameRate,
	permanentTopBar: true,
	aspectRatio: 1.778 // 16:9, TODO: make configurable
};

const settingsSlice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		setDisplayName: ((state, action: PayloadAction<{ displayName: string }>) => {
			state.displayName = action.payload.displayName;
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
		setSelectedAudioDevice: ((state, action: PayloadAction<{ deviceId?: string }>) => {
			state.selectedAudioDevice = action.payload.deviceId;
		}),
		setSelectedVideoDevice: ((state, action: PayloadAction<{ deviceId?: string }>) => {
			state.selectedVideoDevice = action.payload.deviceId;
		}),
		setResolution: ((state, action: PayloadAction<{ resolution: string }>) => {
			state.resolution = action.payload.resolution;
		}),
		setFrameRate: ((state, action: PayloadAction<{ frameRate: number }>) => {
			state.frameRate = action.payload.frameRate;
		})
	},
});

export const settingsActions = settingsSlice.actions;
export default settingsSlice;