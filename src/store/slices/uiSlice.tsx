import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { roomSessionsActions } from './roomSessionsSlice';
import { directMessagesActions } from './directMessagesSlice';
import { roomActions } from './roomSlice';

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
	backgroundSelectDialogOpen: boolean;
	videoBackgroundDialogOpen: boolean;
	extraVideoDialogOpen: boolean;
	extraAudioDialogOpen: boolean;
	permissionsDialogOpen: boolean;
	currentSettingsTab: SettingsTab;
	showStats: boolean;
	chatOpen: boolean;
	activeChatThread: string | null;
	participantListOpen: boolean;
	drawingOpen: boolean;
	unseenFiles: number;
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
	backgroundSelectDialogOpen: false,
	videoBackgroundDialogOpen: false,
	extraVideoDialogOpen: false,
	extraAudioDialogOpen: false,
	permissionsDialogOpen: false,
	currentSettingsTab: 'media',
	chatOpen: false,
	activeChatThread: null,
	participantListOpen: false,
	drawingOpen: false,
	unseenFiles: 0,
};

const uiSlice = createSlice({
	name: 'ui',
	initialState,
	reducers: {
		setUi: ((state, action: PayloadAction<UiUpdate>) => {
			const next = { ...state, ...action.payload };
			const unreadMessages = next.chatOpen && !next.activeChatThread ? 0 : state.unreadMessages;
			const unseenFiles = action.payload.filesharingOpen ? 0 : state.unseenFiles;

			return { ...next, unreadMessages, unseenFiles };
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
		addToUnseenFiles: ((state) => {
			state.unseenFiles += 1;
		}),
		resetUnseenFiles: ((state) => {
			state.unseenFiles = 0;		
		})
	},
	extraReducers: (builder) => {
		builder
			.addCase(roomActions.setState, (state, action) => {
				if (action.payload === 'left') state.activeChatThread = null;
			})
			.addCase(directMessagesActions.hideThread, (state, action) => {
				if (state.activeChatThread !== action.payload) return;

				state.activeChatThread = null;

				if (state.chatOpen) state.unreadMessages = 0;
			})
			.addCase(roomSessionsActions.addMessages, (state, action) => {
				if (state.chatOpen) return;

				const messages = action.payload.messages;

				state.unreadMessages = messages.length;
			});
	}
});

export const uiActions = uiSlice.actions;
export default uiSlice;
