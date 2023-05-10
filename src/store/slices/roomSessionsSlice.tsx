import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { consumersActions } from './consumersSlice';
import { peersActions } from './peersSlice';
import { ChatMessage, FilesharingFile } from '../../utils/types';

export interface RoomSession {
	name?: string;
	sessionId: string;
	parent?: boolean;
	creationTimestamp: number;
	activeSpeakerId?: string;
	fullscreenConsumer?: string;
	windowedConsumers: string[];
	selectedPeers: string[];
	spotlights: string[];
	chatHistory: ChatMessage[];
	fileHistory: FilesharingFile[];
}

export const initialRoomSession = {
	windowedConsumers: [],
	selectedPeers: [],
	spotlights: [],
	chatHistory: [],
	fileHistory: [],
};

const initialState: Record<string, RoomSession> = {};

const roomSessionsSlice = createSlice({
	name: 'roomSessions',
	initialState,
	reducers: {
		addRoomSession: ((state, action: PayloadAction<RoomSession>) => {
			const newSession = { ...initialRoomSession, ...action.payload };

			state[newSession.sessionId] = newSession;
		}),
		removeRoomSession: ((state, action: PayloadAction<string>) => {
			delete state[action.payload];
		}),
		addRoomSessions: ((state, action: PayloadAction<RoomSession[]>) => {
			for (const roomSession of action.payload) {
				const newSession = { ...initialRoomSession, ...roomSession };

				state[newSession.sessionId] = newSession;
			}
		}),
		updateRoomSessionName: ((state, action: PayloadAction<{ sessionId: string, name: string }>) => {
			const roomSession = state[action.payload.sessionId];

			if (roomSession) {
				const {
					name
				} = action.payload;

				roomSession.name = name;
			}
		}),
		setActiveSpeakerId: ((
			state,
			action: PayloadAction<{ sessionId: string, peerId: string, isMe: boolean}>
		) => {
			const { peerId, isMe } = action.payload;

			const roomSession = state[action.payload.sessionId];

			if (!roomSession) return;

			roomSession.activeSpeakerId = peerId;

			if (peerId && !isMe) {
				roomSession.spotlights = roomSession.spotlights.filter((id) => id !== peerId);
				roomSession.spotlights.unshift(peerId);
			}
		}),
		setFullscreenConsumer: ((state, action: PayloadAction<{ sessionId: string, consumerId: string | undefined }>) => {
			const roomSession = state[action.payload.sessionId];

			if (!roomSession) return;

			roomSession.fullscreenConsumer = action.payload.consumerId;
		}),
		addWindowedConsumer: ((state, action: PayloadAction<{ sessionId: string, consumerId: string }>) => {
			const roomSession = state[action.payload.sessionId];

			if (!roomSession) return;

			roomSession.windowedConsumers.push(action.payload.consumerId);
		}),
		removeWindowedConsumer: ((state, action: PayloadAction<{ sessionId: string, consumerId: string }>) => {
			const roomSession = state[action.payload.sessionId];

			if (!roomSession) return;

			roomSession.windowedConsumers =
				roomSession.windowedConsumers.filter((id) => id !== action.payload.consumerId);
		}),
		selectPeer: ((state, action: PayloadAction<{ sessionId: string, peerId: string }>) => {
			const roomSession = state[action.payload.sessionId];

			if (!roomSession) return;

			roomSession.selectedPeers.push(action.payload.peerId);
		}),
		deselectPeer: ((state, action: PayloadAction<{ sessionId: string, peerId: string }>) => {
			const roomSession = state[action.payload.sessionId];

			if (!roomSession) return;

			roomSession.selectedPeers =
				roomSession.selectedPeers.filter((peer) => peer !== action.payload.peerId);
		}),
		spotlightPeer: ((state, action: PayloadAction<{ sessionId: string, peerId: string }>) => {
			const roomSession = state[action.payload.sessionId];

			if (!roomSession) return;

			roomSession.spotlights.push(action.payload.peerId);
		}),
		deSpotlightPeer: ((state, action: PayloadAction<{ sessionId: string, peerId: string }>) => {
			const roomSession = state[action.payload.sessionId];

			if (!roomSession) return;

			roomSession.spotlights =
				roomSession.spotlights.filter((peer) => peer !== action.payload.peerId);
		}),
		addMessage: ((state, action: PayloadAction<ChatMessage>) => {
			const roomSession = state[action.payload.sessionId];

			if (!roomSession) return;

			roomSession.chatHistory.push(action.payload);
		}),
		addMessages: ((state, action: PayloadAction<{ sessionId: string, messages: ChatMessage[] }>) => {
			const roomSession = state[action.payload.sessionId];

			if (!roomSession) return;

			roomSession.chatHistory = action.payload.messages;
		}),
		clearChat: ((state) => {
			for (const roomSession of Object.values(state)) {
				roomSession.chatHistory = [];
			}
		}),
		addFile: ((state, action: PayloadAction<FilesharingFile>) => {
			const roomSession = state[action.payload.sessionId];

			if (!roomSession) return;
			
			roomSession.fileHistory.push(action.payload);
		}),
		updateFile: ((state, action: PayloadAction<FilesharingFile>) => {
			const file = state[action.payload.sessionId]?.fileHistory.find((f) => f.magnetURI === action.payload.magnetURI);

			if (file) {
				const {
					peerId,
					displayName,
					timestamp,
					magnetURI,
					started,
				} = action.payload;

				if (peerId)
					file.peerId = peerId;
				if (displayName)
					file.displayName = displayName;
				if (timestamp)
					file.timestamp = timestamp;
				if (magnetURI)
					file.magnetURI = magnetURI;
				if (started !== undefined)
					file.started = started;
			}
		}),
		addFiles: ((state, action: PayloadAction<{ sessionId: string, files: FilesharingFile[] }>) => {
			const roomSession = state[action.payload.sessionId];

			if (!roomSession) return;

			roomSession.fileHistory = action.payload.files;
		}),
		clearFiles: ((state) => {
			for (const roomSession of Object.values(state)) {
				roomSession.fileHistory = [];
			}
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(peersActions.addPeer, (state, action) => {
				const roomSession = state[action.payload.sessionId];

				roomSession?.spotlights.push(action.payload.id);
			})
			.addCase(peersActions.addPeers, (state, action) => {
				for (const peer of action.payload) {
					const roomSession = state[peer.sessionId];

					roomSession?.spotlights.push(peer.id);
				}
			})
			.addCase(peersActions.setPeerSessionId, (state, action) => {
				const newSession = state[action.payload.sessionId];
				const oldSession = state[action.payload.oldSessionId];

				if (newSession) newSession.spotlights.push(action.payload.id);

				if (oldSession) {
					oldSession.spotlights = oldSession.spotlights.filter((peer) => peer !== action.payload.id);
					oldSession.selectedPeers = oldSession.selectedPeers.filter((peer) => peer !== action.payload.id);
				}
			})
			.addCase(peersActions.removePeer, (state, action) => {
				for (const roomSession of Object.values(state)) {
					roomSession.spotlights = roomSession.spotlights.filter((peer) => peer !== action.payload.id);
					roomSession.selectedPeers = roomSession.selectedPeers.filter((peer) => peer !== action.payload.id);
				}
			})
			.addCase(consumersActions.removeConsumer, (state, action) => {
				for (const roomSession of Object.values(state)) {
					roomSession.windowedConsumers =
						roomSession.windowedConsumers.filter((id) => id !== action.payload.consumerId);
				}
			})
			.addCase(peersActions.updatePeer, (state, action) => {
				if (action.payload.displayName) {
					const { id, displayName } = action.payload;

					for (const roomSession of Object.values(state)) {
						roomSession.chatHistory.forEach((message) => {
							if (message.peerId === id)
								message.displayName = displayName;
						});
						roomSession.fileHistory.forEach((file) => {
							if (file.peerId === id)
								file.displayName = displayName;
						});
					}
				}
			})
			/* .addCase(roomActions.setState, (_state, action) => {
				if (action.payload === 'left')
					return [];
			}) */;
	}
});

export const roomSessionsActions = roomSessionsSlice.actions;
export default roomSessionsSlice;