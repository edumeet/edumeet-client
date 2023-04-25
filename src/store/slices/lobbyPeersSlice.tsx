import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { roomActions } from './roomSlice';

export interface LobbyPeer {
	id: string;
	displayName?: string;
	picture?: string;
	audioOnly?: boolean;
	promotionInProgress?: boolean;
}

export type LobbyPeersState = LobbyPeer[];

const initialState: LobbyPeersState = [];

const lobbyPeersSlice = createSlice({
	name: 'lobbyPeers',
	initialState,
	reducers: {
		addPeers: ((state, action: PayloadAction<LobbyPeer[]>) => {
			return [ ...state, ...action.payload ];
		}),
		addPeer: ((state, action: PayloadAction<LobbyPeer>) => {
			state.push(action.payload);
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
					audioOnly,
					promotionInProgress
				} = action.payload;

				if (displayName)
					peer.displayName = displayName;
				if (picture)
					peer.picture = picture;
				if (audioOnly)
					peer.audioOnly = audioOnly;
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