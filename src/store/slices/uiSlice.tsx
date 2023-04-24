import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SettingsTab = 'media' | 'appearance' | 'advanced';
export type HelpTab = 'shortcuts';

export interface UiState {
	fullScreenConsumer?: string;
	windowConsumer?: string;
	drawerWindow: boolean;
	settingsOpen: boolean;
	filesharingOpen: boolean;
	extraVideoOpen: boolean;
	rolesManagerOpen: boolean;
	helpOpen: boolean;
	aboutOpen: boolean;
	lobbyDialogOpen: boolean;
	extraVideoDialogOpen: boolean;
	privacyDisclaimerOpen: boolean;
	currentSettingsTab: SettingsTab;
	currentHelpTab: HelpTab;
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
	aboutOpen: false,
	lobbyDialogOpen: false,
	extraVideoDialogOpen: false,
	privacyDisclaimerOpen: false,
	currentSettingsTab: 'media',
	currentHelpTab: 'shortcuts'
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
	},
});

export const uiActions = uiSlice.actions;
export default uiSlice;