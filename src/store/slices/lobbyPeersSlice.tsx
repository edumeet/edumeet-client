import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LobbyPeer {
	id: string;
	displayName?: string;
	picture?: string;
	promotionInProgress?: boolean;
}

export type LobbyPeersState = Record<string, LobbyPeer>;

const initialState: LobbyPeersState = {};

const lobbyPeersSlice = createSlice({
	name: 'lobbyPeers',
	initialState,
	reducers: {
		addPeer: ((state, action: PayloadAction<LobbyPeer>) => {
			state[action.payload.id] = {
				...action.payload
			};
		}),
		removePeer: ((state, action: PayloadAction<LobbyPeer>) => {
			delete state[action.payload.id];
		}),
		updatePeer: ((state, action: PayloadAction<LobbyPeer>) => {
			const peer = state[action.payload.id];

			if (peer) {
				state[action.payload.id] = {
					...peer,
					...action.payload
				};
			}
		}),
	},
});

export const lobbyPeersActions = lobbyPeersSlice.actions;
export default lobbyPeersSlice;