import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { roomSessionsActions } from './roomSessionsSlice';

export type SettingsTab = 'media' | 'appearance' | 'advanced' | 'management';

export interface UiState {
	fullScreenConsumer?: string;
	windowConsumer?: string;
	unreadMessages: number;
	settingsOpen: boolean;
	filesharingOpen: boolean;
	extraVideoOpen: boolean;
	helpOpen: boolean;
	aboutOpen: boolean;
	lobbyDialogOpen: boolean;
	extraVideoDialogOpen: boolean;
	extraAudioDialogOpen: boolean;
	currentSettingsTab: SettingsTab;
	showStats: boolean;
	chatOpen: boolean;
	participantListOpen: boolean;
}

type UiUpdate = Partial<Omit<UiState, 'currentSettingsTab'>>;

const initialState: UiState = {
	unreadMessages: 0,
	showStats: false,
	settingsOpen: false,
	filesharingOpen: false,
	extraVideoOpen: false,
	helpOpen: false,
	aboutOpen: false,
	lobbyDialogOpen: false,
	extraVideoDialogOpen: false,
	extraAudioDialogOpen: false,
	currentSettingsTab: 'media',
	chatOpen: false,
	participantListOpen: false,
};

const uiSlice = createSlice({
	name: 'ui',
	initialState,
	reducers: {
		setUi: ((state, action: PayloadAction<UiUpdate>) => {
			const unreadMessages = action.payload.chatOpen ? 0 : state.unreadMessages;

			return { ...state, ...action.payload, unreadMessages };
		}),
		setCurrentSettingsTab: ((
			state,
			action: PayloadAction<SettingsTab>
		) => {
			state.currentSettingsTab = action.payload;
		}),
		addToUnreadMessages: ((state) => {
			state.unreadMessages += 1;
		}),
		resetUnreadMessages: ((state) => {
			state.unreadMessages = 0;
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(roomSessionsActions.addMessages, (state, action) => {
				if (state.chatOpen) return;

				const messages = action.payload.messages;

				state.unreadMessages = messages.length;
			});
	}
});

export const uiActions = uiSlice.actions;
export default uiSlice;