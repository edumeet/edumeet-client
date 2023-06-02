import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SettingsTab = 'media' | 'appearance' | 'advanced';
export type HelpTab = 'shortcuts';
export type StatsTab = 'general' | 'ice';

export interface UiState {
	fullScreenConsumer?: string;
	windowConsumer?: string;
	drawerWindow: boolean;
	settingsOpen: boolean;
	filesharingOpen: boolean;
	extraVideoOpen: boolean;
	rolesManagerOpen: boolean;
	helpOpen: boolean;
	statsOpen: boolean;
	aboutOpen: boolean;
	lobbyDialogOpen: boolean;
	extraVideoDialogOpen: boolean;
	currentSettingsTab: SettingsTab;
	currentHelpTab: HelpTab;
	currentStatsTab: StatsTab;
	showStats: boolean;
}

type UiUpdate = Partial<Omit<UiState, 'currentSettingsTab'>>;

const initialState: UiState = {
	showStats: false,
	drawerWindow: false,
	settingsOpen: false,
	filesharingOpen: false,
	extraVideoOpen: false,
	rolesManagerOpen: false,
	helpOpen: false,
	statsOpen: false,
	aboutOpen: false,
	lobbyDialogOpen: false,
	extraVideoDialogOpen: false,
	currentSettingsTab: 'media',
	currentHelpTab: 'shortcuts',
	currentStatsTab: 'general',
};

const uiSlice = createSlice({
	name: 'ui',
	initialState,
	reducers: {
		setUi: ((state, action: PayloadAction<UiUpdate>) => {
			return { ...state, ...action.payload };
		}),
		setCurrentSettingsTab: ((
			state,
			action: PayloadAction<SettingsTab>
		) => {
			state.currentSettingsTab = action.payload;
		}),
		setCurrentHelpTab: ((
			state,
			action: PayloadAction<HelpTab>
		) => {
			state.currentHelpTab = action.payload;
		}),
		setCurrentStatsTab: ((
			state,
			action: PayloadAction<StatsTab>
		) => {
			state.currentStatsTab = action.payload;
		}),
	},
});

export const uiActions = uiSlice.actions;
export default uiSlice;