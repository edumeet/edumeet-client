import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { peersActions } from './peersSlice';
import { roomActions } from './roomSlice';
import { DirectChatMessage } from '../../utils/types';

export interface DirectMessageThread {
	peerId: string;
	displayName?: string;
	messages: DirectChatMessage[];
	unread: number;
	hidden: boolean;
	peerGone: boolean;
}

const initialState: Record<string, DirectMessageThread> = {};

const createThread = (peerId: string, displayName?: string): DirectMessageThread => ({
	peerId,
	displayName,
	messages: [],
	unread: 0,
	hidden: false,
	peerGone: false,
});

const directMessagesSlice = createSlice({
	name: 'directMessages',
	initialState,
	reducers: {
		openThread: ((state, action: PayloadAction<{ peerId: string, displayName?: string, peerGone?: boolean }>) => {
			const { peerId, displayName, peerGone } = action.payload;

			if (!state[peerId]) state[peerId] = createThread(peerId, displayName);

			const thread = state[peerId];

			if (displayName) thread.displayName = displayName;
			if (peerGone !== undefined) thread.peerGone = peerGone;

			thread.hidden = false;
			thread.unread = 0;
		}),
		// Hiding keeps the transcript, so a reopened thread still shows its history.
		hideThread: ((state, action: PayloadAction<string>) => {
			const thread = state[action.payload];

			if (thread) {
				thread.hidden = true;
				thread.unread = 0;
			}
		}),
		addDirectMessage: ((state, action: PayloadAction<{ peerId: string, message: DirectChatMessage, unread: boolean }>) => {
			const { peerId, message, unread } = action.payload;

			if (!state[peerId]) state[peerId] = createThread(peerId, message.displayName);

			const thread = state[peerId];

			thread.hidden = false;
			thread.messages.push(message);

			if (unread) thread.unread += 1;
		}),
		markThreadRead: ((state, action: PayloadAction<string>) => {
			const thread = state[action.payload];

			if (thread) thread.unread = 0;
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(peersActions.addPeer, (state, action) => {
				const thread = state[action.payload.id];

				if (thread) thread.peerGone = false;
			})
			.addCase(peersActions.removePeer, (state, action) => {
				const thread = state[action.payload.id];

				if (thread) thread.peerGone = true;
			})
			.addCase(peersActions.updatePeer, (state, action) => {
				if (!action.payload.displayName) return;

				const { id, displayName } = action.payload;
				const thread = state[id];

				if (thread) {
					thread.displayName = displayName;
					thread.messages.forEach((message) => {
						if (message.peerId === id) message.displayName = displayName;
					});
				}
			})
			.addCase(roomActions.setState, (_state, action) => {
				if (action.payload === 'left') return initialState;
			});
	}
});

export const directMessagesActions = directMessagesSlice.actions;
export default directMessagesSlice;
