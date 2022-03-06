import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LobbyPeer {
	id: string;
	displayName?: string;
	picture?: string;
	promotionInProgress?: boolean;
}

export interface LobbyState {
	peers: Record<string, LobbyPeer>;
}

const initialState: LobbyState = {
	peers: {},
};

const lobbySlice = createSlice({
	name: 'lobby',
	initialState,
	reducers: {
		addPeer: ((state, action: PayloadAction<LobbyPeer>) => {
			state.peers[action.payload.id] = {
				...action.payload
			};
		}),
		removePeer: ((state, action: PayloadAction<LobbyPeer>) => {
			delete state.peers[action.payload.id];
		}),
		updatePeer: ((state, action: PayloadAction<LobbyPeer>) => {
			const peer = state.peers[action.payload.id];

			if (peer) {
				state.peers[action.payload.id] = {
					...peer,
					...action.payload
				};
			}
		}),
	},
});

export const lobbyActions = lobbySlice.actions;
export default lobbySlice;