import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { roomActions } from './roomSlice';

export interface LobbyPeer {
	id: string;
	displayName?: string;
	picture?: string;
	promotionInProgress?: boolean;
}

export type LobbyPeersState = LobbyPeer[];

const initialState: LobbyPeersState = [];

const lobbyPeersSlice = createSlice({
	name: 'lobbyPeers',
	initialState,
	reducers: {
		addPeers: ((state, action: PayloadAction<LobbyPeer[]>) => {
			const existingIds = new Set(state.map((peer) => peer.id));
			const newPeers = action.payload.filter((peer) => !existingIds.has(peer.id));
  
			return [ ...state, ...newPeers ];
		}),
		addPeer: ((state, action: PayloadAction<LobbyPeer>) => {
			const peer = state.find((p) => p.id === action.payload.id);

			if (!peer) {
				state.push(action.payload);
			}
		}),
		removePeer: ((state, action: PayloadAction<LobbyPeer>) => {
			return state.filter((peer) => peer.id !== action.payload.id);
		}),
		updatePeer: ((state, action: PayloadAction<LobbyPeer>) => {
			const peer = state.find((p) => p.id === action.payload.id);

			if (peer) {
				const {
					displayName,
					picture,
					promotionInProgress
				} = action.payload;

				if (displayName)
					peer.displayName = displayName;
				if (picture)
					peer.picture = picture;
				if (promotionInProgress)
					peer.promotionInProgress = promotionInProgress;
			}
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(roomActions.setState, (_state, action) => {
				if (action.payload === 'left')
					return [];
			});
	}
});

export const lobbyPeersActions = lobbyPeersSlice.actions;
export default lobbyPeersSlice;