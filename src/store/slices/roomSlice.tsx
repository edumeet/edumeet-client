import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RoomConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'closed';
export type SettingsTab = 'media' | 'appearance' | 'advanced';

export interface RoomState {
	name?: string;
	state: RoomConnectionState;
	joined: boolean;
	inLobby: boolean;
	overRoomLimit: boolean;
	activeSpeakerId?: string;
	selectedPeers: Set<string>;
	spotlights: Set<string>;
	muteAllInProgress: boolean;
	lobbyPeersPromotionInProgress: boolean;
	stopAllVideoInProgress: boolean;
	closeMeetingInProgress: boolean;
	clearChatInProgress: boolean;
	clearFileSharingInProgress: boolean;
}

const initialState: RoomState = {
	state: 'new',
	joined: false,
	inLobby: false,
	overRoomLimit: false,
	selectedPeers: new Set(),
	spotlights: new Set(),
	muteAllInProgress: false,
	lobbyPeersPromotionInProgress: false,
	stopAllVideoInProgress: false,
	closeMeetingInProgress: false,
	clearChatInProgress: false,
	clearFileSharingInProgress: false
};

const roomSlice = createSlice({
	name: 'room',
	initialState,
	reducers: {
		setName: ((state, action: PayloadAction<{ name: string }>) => {
			state.name = action.payload.name;
		}),
		setRoomState: ((
			state,
			action: PayloadAction<{
				state: RoomConnectionState
			}>
		) => {
			state.state = action.payload.state;
		}),
		setInLobby: ((state, action: PayloadAction<{ inLobby: boolean }>) => {
			state.inLobby = action.payload.inLobby;
		}),
		setOverRoomLimit: ((state, action: PayloadAction<{ overRoomLimit: boolean }>) => {
			state.overRoomLimit = action.payload.overRoomLimit;
		}),
		setActiveSpeakerId: ((state, action: PayloadAction<{ activeSpeakerId: string }>) => {
			state.activeSpeakerId = action.payload.activeSpeakerId;
		}),
		selectPeer: ((state, action: PayloadAction<{ peerId: string }>) => {
			state.selectedPeers.add(action.payload.peerId);
		}),
		deselectPeer: ((state, action: PayloadAction<{ peerId: string }>) => {
			state.selectedPeers.delete(action.payload.peerId);
		}),
		// TODO: spotlight actions
		joined: ((state) => {
			state.joined = true;
		}),
		setMuteAllInProgress: ((
			state,
			action: PayloadAction<{ muteAllInProgress: boolean }>
		) => {
			state.muteAllInProgress = action.payload.muteAllInProgress;
		}),
		setLobbyPeersPromotionInProgress: ((
			state,
			action: PayloadAction<{ lobbyPeersPromotionInProgress: boolean }>
		) => {
			state.lobbyPeersPromotionInProgress = action.payload.lobbyPeersPromotionInProgress;
		}),
		setStopAllVideoInProgress: ((
			state,
			action: PayloadAction<{ stopAllVideoInProgress: boolean }>
		) => {
			state.stopAllVideoInProgress = action.payload.stopAllVideoInProgress;
		}),
		setCloseMeetingInProgress: ((
			state,
			action: PayloadAction<{ closeMeetingInProgress: boolean }>
		) => {
			state.closeMeetingInProgress = action.payload.closeMeetingInProgress;
		}),
		setClearChatInProgress: ((
			state,
			action: PayloadAction<{ clearChatInProgress: boolean }>
		) => {
			state.clearChatInProgress = action.payload.clearChatInProgress;
		}),
		setClearFileSharingInProgress: ((
			state,
			action: PayloadAction<{ clearFileSharingInProgress: boolean }>
		) => {
			state.clearFileSharingInProgress = action.payload.clearFileSharingInProgress;
		}),
	},
});

export const roomActions = roomSlice.actions;
export default roomSlice;