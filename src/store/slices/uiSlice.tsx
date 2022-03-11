import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SettingsTab = 'media' | 'appearance' | 'advanced';

export interface UiState {
	fullScreenConsumer?: string;
	windowConsumer?: string;
	settingsOpen?: boolean;
	extraVideoOpen?: boolean;
	hideSelfView?: boolean;
	rolesManagerOpen?: boolean;
	helpOpen?: boolean;
	aboutOpen?: boolean;
	leaveOpen?: boolean;
	lockDialogOpen?: boolean;
	currentSettingsTab: SettingsTab;
}

type UiUpdate = Omit<UiState, 'currentSettingsTab'>;

const initialState: UiState = {
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
			action: PayloadAction<{ currentSettingsTab: SettingsTab }>
		) => {
			state.currentSettingsTab = action.payload.currentSettingsTab;
		}),
	},
});

export const uiActions = uiSlice.actions;
export default uiSlice;