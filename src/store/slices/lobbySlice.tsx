import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LobbyPeer {
	id: string;
	displayName?: string;
	picture?: string;
	promotionInProgress: boolean;
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
		addPeer: ((
			state,
			action: PayloadAction<{
				id: string,
				displayName?: string,
				picture?: string,
			}>
		) => {
			state.peers[action.payload.id] = {
				...action.payload
			} as LobbyPeer;
		}),
		removePeer: ((state, action: PayloadAction<{ id: string }>) => {
			delete state.peers[action.payload.id];
		}),
		setDisplayName: ((
			state,
			action: PayloadAction<{ id: string, displayName: string }>
		) => {
			if (state.peers[action.payload.id]) {
				state.peers[action.payload.id].displayName = action.payload.displayName;
			}
		}),
		setPicture: ((state, action: PayloadAction<{ id: string, picture: string }>) => {
			if (state.peers[action.payload.id]) {
				state.peers[action.payload.id].picture = action.payload.picture;
			}
		}),
		setPromotionInProgress: ((
			state,
			action: PayloadAction<{ id: string, promotionInProgress: boolean }>
		) => {
			if (state.peers[action.payload.id]) {
				state.peers[action.payload.id].promotionInProgress =
					action.payload.promotionInProgress;
			}
		}),
	},
});

export const lobbyActions = lobbySlice.actions;
export default lobbySlice;