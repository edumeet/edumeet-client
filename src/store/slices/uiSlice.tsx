import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SettingsTab = 'media' | 'appearance';

export interface UiState {
	fullScreenConsumer?: string;
	windowConsumer?: string;
	drawerWindow?: boolean;
	settingsOpen?: boolean;
	filesharingOpen?: boolean;
	extraVideoOpen?: boolean;
	hideSelfView?: boolean;
	rolesManagerOpen?: boolean;
	helpOpen?: boolean;
	aboutOpen?: boolean;
	leaveOpen?: boolean;
	lobbyDialogOpen?: boolean;
	extraVideoDialogOpen?: boolean;
	currentSettingsTab: SettingsTab;
}

type UiUpdate = Omit<UiState, 'currentSettingsTab'>;

const initialState: UiState = {
	drawerWindow: false,
	settingsOpen: false,
	filesharingOpen: false,
	extraVideoOpen: false,
	hideSelfView: false,
	rolesManagerOpen: false,
	helpOpen: false,
	aboutOpen: false,
	leaveOpen: false,
	lobbyDialogOpen: false,
	extraVideoDialogOpen: false,
	currentSettingsTab: 'media'
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