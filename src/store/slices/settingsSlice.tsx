import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import edumeetConfig from '../../utils/edumeetConfig';

export interface SettingsState {
	displayName?: string;
	advancedMode?: boolean;
	drawerOverlayed: boolean;
	permanentTopBar: boolean;
}

const initialState: SettingsState = {
	drawerOverlayed: edumeetConfig.drawerOverlayed,
	permanentTopBar: true
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
	},
});

export const settingsActions = settingsSlice.actions;
export default settingsSlice;