import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { peersActions } from './peersSlice';

export type RoomConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'closed';
export type SettingsTab = 'media' | 'appearance';

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
	startFileSharingInProgress?: boolean;
	fullscreenConsumer?: string;
	windowedConsumer?: string;
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
			action: PayloadAction<RoomConnectionState>
		) => {
			state.state = action.payload;
		}),
		setActiveSpeakerId: ((
			state,
			action: PayloadAction<{ peerId: string, isMe: boolean}>
		) => {
			const { peerId, isMe } = action.payload;

			state.activeSpeakerId = peerId;

			if (peerId && !isMe) {
				state.spotlights = state.spotlights.filter((id) => id !== peerId);
				state.spotlights.unshift(peerId);
			}
		}),
		setFullscreenConsumer: ((state, action: PayloadAction<string | undefined>) => {
			state.fullscreenConsumer = action.payload;
		}),
		setWindowedConsumer: ((state, action: PayloadAction<string | undefined>) => {
			state.windowedConsumer = action.payload;
		}),
		selectPeer: ((state, action: PayloadAction<string>) => {
			state.selectedPeers.push(action.payload);
		}),
		deselectPeer: ((state, action: PayloadAction<string>) => {
			state.selectedPeers =
				state.selectedPeers.filter((peer) => peer !== action.payload);
		}),
		addSpotlightList: ((state, action: PayloadAction<string[]>) => {
			state.spotlights = [ ...action.payload ];
		}),
		spotlightPeer: ((state, action: PayloadAction<string>) => {
			state.spotlights.push(action.payload);
		}),
		deSpotlightPeer: ((state, action: PayloadAction<string>) => {
			state.spotlights =
				state.spotlights.filter((peer) => peer !== action.payload);
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(peersActions.addPeer, (state, action) => {
				state.spotlights.push(action.payload.id);
			})
			.addCase(peersActions.removePeer, (state, action) => {
				state.spotlights = state.spotlights.filter((peer) => peer !== action.payload.id);
				state.selectedPeers =
					state.selectedPeers.filter((peer) => peer !== action.payload.id);
			});
	}
});

export const roomActions = roomSlice.actions;
export default roomSlice;