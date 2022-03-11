import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RoomConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'closed';
export type SettingsTab = 'media' | 'appearance' | 'advanced';

export interface RoomState {
	name?: string;
	joined?: boolean;
	inLobby?: boolean;
	overRoomLimit?: boolean;
	activeSpeakerId?: string;
	muteAllInProgress?: boolean;
	lobbyPeersPromotionInProgress?: boolean;
	stopAllVideoInProgress?: boolean;
	closeMeetingInProgress?: boolean;
	clearChatInProgress?: boolean;
	clearFileSharingInProgress?: boolean;
	selectedPeers: string[];
	spotlights: string[];
	state: RoomConnectionState;
}

type RoomUpdate = Omit<RoomState, 'state' | 'selectedPeers' | 'spotlights'>;

const initialState: RoomState = {
	state: 'new',
	selectedPeers: [],
	spotlights: []
};

const roomSlice = createSlice({
	name: 'room',
	initialState,
	reducers: {
		updateRoom: ((state, action: PayloadAction<RoomUpdate>) => {
			return { ...state, ...action.payload };
		}),
		setRoomState: ((
			state,
			action: PayloadAction<{
				state: RoomConnectionState
			}>
		) => {
			state.state = action.payload.state;
		}),
		selectPeer: ((state, action: PayloadAction<{ peerId: string }>) => {
			state.selectedPeers.push(action.payload.peerId);
		}),
		deselectPeer: ((state, action: PayloadAction<{ peerId: string }>) => {
			state.selectedPeers =
				state.selectedPeers.filter((peer) => peer !== action.payload.peerId);
		}),
		spotlightPeer: ((state, action: PayloadAction<{ peerId: string }>) => {
			state.spotlights.push(action.payload.peerId);
		}),
		deSpotlightPeer: ((state, action: PayloadAction<{ peerId: string }>) => {
			state.spotlights =
				state.spotlights.filter((peer) => peer !== action.payload.peerId);
		}),
	},
});

export const roomActions = roomSlice.actions;
export default roomSlice;