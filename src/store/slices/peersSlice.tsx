import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Peer {
	id: string;
	displayName?: string;
	picture?: string;
	videoInProgress?: boolean;
	stopVideoInProgress?: boolean;
	audioInProgress?: boolean;
	stopAudioInProgress?: boolean;
	screenInProgress?: boolean;
	stopScreenSharingInProgress?: boolean;
	kickInProgress?: boolean;
	modifyRolesInProgress?: boolean;
	raisedHandInProgress?: boolean;
	raisedHand?: boolean;
	raisedHandTimestamp?: Date;
	roles: number[]; // Role IDs
}

type PeerUpdate = Omit<Peer, | 'roles'>;

export type PeersState = Peer[];

const initialState: PeersState = [];

const peersSlice = createSlice({
	name: 'peers',
	initialState,
	reducers: {
		addPeer: ((state, action: PayloadAction<Peer>) => {
			state.push(action.payload);
		}),
		removePeer: ((state, action: PayloadAction<PeerUpdate>) => {
			return state.filter((peer) => peer.id !== action.payload.id);
		}),
		updatePeer: ((state, action: PayloadAction<PeerUpdate>) => {
			let peer = state.find((p) => p.id === action.payload.id);

			if (peer) {
				peer = { ...peer, ...action.payload };
			}
		}),
		addRole: ((state, action: PayloadAction<{ id: string, roleId: number }>) => {
			const { roleId } = action.payload;
			const peer = state.find((p) => p.id === action.payload.id);

			if (peer) {
				peer.roles.push(roleId);
			}
		}),
		removeRole: ((state, action: PayloadAction<{ id: string, roleId: number }>) => {
			const { roleId } = action.payload;
			const peer = state.find((p) => p.id === action.payload.id);

			if (peer) {
				peer.roles =
					peer.roles.filter((role) => role !== roleId);
			}
		}),
	}
});

export const peersActions = peersSlice.actions;
export default peersSlice;