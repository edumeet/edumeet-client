import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import edumeetConfig from '../../utils/edumeetConfig';

export interface SettingsState {
	displayName?: string;
	advancedMode?: boolean;
	drawerOverlayed: boolean;
}

const initialState: SettingsState = {
	drawerOverlayed: edumeetConfig.drawerOverlayed
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
	},
});

export const settingsActions = settingsSlice.actions;
export default settingsSlice;