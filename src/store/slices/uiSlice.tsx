import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SettingsTab = 'media' | 'appearance';

export interface UiState {
	fullScreenConsumer?: string;
	windowConsumer?: string;
	settingsOpen: boolean;
	filesharingOpen: boolean;
	extraVideoOpen: boolean;
	helpOpen: boolean;
	aboutOpen: boolean;
	lobbyDialogOpen: boolean;
	extraVideoDialogOpen: boolean;
	currentSettingsTab: SettingsTab;
	showStats: boolean;
	chatOpen: boolean;
	participantListOpen: boolean;
}

type UiUpdate = Partial<Omit<UiState, 'currentSettingsTab'>>;

const initialState: UiState = {
	showStats: false,
	settingsOpen: false,
	filesharingOpen: false,
	extraVideoOpen: false,
	helpOpen: false,
	aboutOpen: false,
	lobbyDialogOpen: false,
	extraVideoDialogOpen: false,
	currentSettingsTab: 'media',
	chatOpen: false,
	participantListOpen: false,
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
	},
});

export const uiActions = uiSlice.actions;
export default uiSlice;