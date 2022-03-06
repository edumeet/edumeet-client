import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Role } from '../../utils/roles';

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
	consumers: Set<string>; // Consumer IDs
	roles: Set<number>; // Role IDs
}

type PeerUpdate = Omit<Peer, 'consumers' | 'roles'>;

export interface PeersState {
	peers: Record<string, Peer>,
}

const initialPeer: Peer = {
	id: 'invalid',
	consumers: new Set<string>(),
	roles: new Set<number>()
};

const initialState: PeersState = {
	peers: {},
};

const peersSlice = createSlice({
	name: 'peers',
	initialState,
	reducers: {
		addPeer: ((state, action: PayloadAction<PeerUpdate>) => {
			state.peers[action.payload.id] = {
				...initialPeer,
				...action.payload
			};
		}),
		removePeer: ((state, action: PayloadAction<PeerUpdate>) => {
			delete state.peers[action.payload.id];
		}),
		updatePeer: ((state, action: PayloadAction<PeerUpdate>) => {
			const peer = state.peers[action.payload.id];

			if (peer) {
				state.peers[action.payload.id] = {
					...peer,
					...action.payload
				};
			}
		}),
		addConsumer: ((
			state,
			action: PayloadAction<{ id: string, consumerId: string }>
		) => {
			const { id, consumerId } = action.payload;

			state.peers[id].consumers.add(consumerId);
		}),
		removeConsumer: ((
			state,
			action: PayloadAction<{ id: string, consumerId: string }>
		) => {
			const { id, consumerId } = action.payload;

			state.peers[id].consumers.delete(consumerId);
		}),
		addRole: ((state, action: PayloadAction<{ id: string, roleId: number }>) => {
			const { id, roleId } = action.payload;

			state.peers[id].roles.add(roleId);
		}),
		removeRole: ((state, action: PayloadAction<{ id: string, roleId: number }>) => {
			const { id, roleId } = action.payload;

			state.peers[id].roles.delete(roleId);
		}),
	},
});

export const peersActions = peersSlice.actions;
export default peersSlice;