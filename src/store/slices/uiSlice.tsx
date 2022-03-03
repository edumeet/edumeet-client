import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SettingsTab = 'media' | 'appearance' | 'advanced';

export interface UiState {
	fullScreenConsumer?: string;
	windowConsumer?: string;
	toolbarsVisible: boolean;
	settingsOpen: boolean;
	extraVideoOpen: boolean;
	hideSelfView: boolean;
	rolesManagerOpen: boolean;
	helpOpen: boolean;
	aboutOpen: boolean;
	leaveOpen: boolean;
	currentSettingsTab: SettingsTab;
	lockDialogOpen: boolean;
}

const initialState: UiState = {
	toolbarsVisible: false,
	settingsOpen: false,
	extraVideoOpen: false,
	hideSelfView: false,
	rolesManagerOpen: false,
	helpOpen: false,
	aboutOpen: false,
	leaveOpen: false,
	currentSettingsTab: 'media',
	lockDialogOpen: false
};

const uiSlice = createSlice({
	name: 'ui',
	initialState,
	reducers: {
		setFullScreenConsumer: ((
			state,
			action: PayloadAction<{ fullScreenConsumer: string }>
		) => {
			state.fullScreenConsumer = action.payload.fullScreenConsumer;
		}),
		setWindowConsumer: ((state, action: PayloadAction<{ windowConsumer: string }>) => {
			state.windowConsumer = action.payload.windowConsumer;
		}),
		setToolbarsVisible: ((state, action: PayloadAction<{ toolbarsVisible: boolean }>) => {
			state.toolbarsVisible = action.payload.toolbarsVisible;
		}),
		setSettingsOpen: ((state, action: PayloadAction<{ settingsOpen: boolean }>) => {
			state.settingsOpen = action.payload.settingsOpen;
		}),
		setExtraVideoOpen: ((state, action: PayloadAction<{ extraVideoOpen: boolean }>) => {
			state.extraVideoOpen = action.payload.extraVideoOpen;
		}),
		hideSelfView: ((state, action: PayloadAction<{ hideSelfView: boolean }>) => {
			state.hideSelfView = action.payload.hideSelfView;
		}),
		setRolesManagerOpen: ((
			state,
			action: PayloadAction<{ rolesManagerOpen: boolean }>
		) => {
			state.rolesManagerOpen = action.payload.rolesManagerOpen;
		}),
		setHelpOpen: ((state, action: PayloadAction<{ helpOpen: boolean }>) => {
			state.helpOpen = action.payload.helpOpen;
		}),
		setAboutOpen: ((state, action: PayloadAction<{ aboutOpen: boolean }>) => {
			state.aboutOpen = action.payload.aboutOpen;
		}),
		setLeaveOpen: ((state, action: PayloadAction<{ leaveOpen: boolean }>) => {
			state.leaveOpen = action.payload.leaveOpen;
		}),
		setCurrentSettingsTab: ((
			state,
			action: PayloadAction<{ currentSettingsTab: SettingsTab }>
		) => {
			state.currentSettingsTab = action.payload.currentSettingsTab;
		}),
		setLockDialogOpen: ((state, action: PayloadAction<{ lockDialogOpen: boolean }>) => {
			state.lockDialogOpen = action.payload.lockDialogOpen;
		}),
	},
});

export const uiActions = uiSlice.actions;
export default uiSlice;