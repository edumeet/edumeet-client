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
	consumers: string[]; // Consumer IDs
	roles: number[]; // Role IDs
}

type PeerUpdate = Omit<Peer, 'consumers' | 'roles'>;

export type PeersState = Record<string, Peer>;

const initialPeer: Peer = {
	id: 'invalid',
	consumers: [],
	roles: []
};

const initialState: PeersState = {};

const peersSlice = createSlice({
	name: 'peers',
	initialState,
	reducers: {
		addPeer: ((state, action: PayloadAction<PeerUpdate>) => {
			state[action.payload.id] = {
				...initialPeer,
				...action.payload
			};
		}),
		removePeer: ((state, action: PayloadAction<PeerUpdate>) => {
			delete state[action.payload.id];
		}),
		updatePeer: ((state, action: PayloadAction<PeerUpdate>) => {
			const peer = state[action.payload.id];

			if (peer) {
				state[action.payload.id] = {
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

			state[id].consumers.push(consumerId);
		}),
		removeConsumer: ((
			state,
			action: PayloadAction<{ id: string, consumerId: string }>
		) => {
			const { id, consumerId } = action.payload;

			state[id].consumers =
				state[id].consumers.filter((consumer) => consumer !== consumerId);
		}),
		addRole: ((state, action: PayloadAction<{ id: string, roleId: number }>) => {
			const { id, roleId } = action.payload;

			state[id].roles.push(roleId);
		}),
		removeRole: ((state, action: PayloadAction<{ id: string, roleId: number }>) => {
			const { id, roleId } = action.payload;

			state[id].roles =
				state[id].roles.filter((role) => role !== roleId);
		}),
	},
});

export const peersActions = peersSlice.actions;
export default peersSlice;