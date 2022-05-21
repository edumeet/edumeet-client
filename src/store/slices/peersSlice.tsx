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
			const peer = state.find((p) => p.id === action.payload.id);

			if (peer) {
				const {
					displayName,
					picture,
					videoInProgress,
					stopVideoInProgress,
					audioInProgress,
					stopAudioInProgress,
					screenInProgress,
					stopScreenSharingInProgress,
					kickInProgress,
					modifyRolesInProgress,
					raisedHandInProgress,
					raisedHand,
					raisedHandTimestamp
				} = action.payload;

				if (displayName)
					peer.displayName = displayName;
				if (picture)
					peer.picture = picture;
				if (videoInProgress !== undefined)
					peer.videoInProgress = videoInProgress;
				if (stopVideoInProgress !== undefined)
					peer.stopVideoInProgress = stopVideoInProgress;
				if (audioInProgress !== undefined)
					peer.audioInProgress = audioInProgress;
				if (stopAudioInProgress !== undefined)
					peer.stopAudioInProgress = stopAudioInProgress;
				if (screenInProgress !== undefined)
					peer.screenInProgress = screenInProgress;
				if (stopScreenSharingInProgress !== undefined)
					peer.stopScreenSharingInProgress = stopScreenSharingInProgress;
				if (kickInProgress !== undefined)
					peer.kickInProgress = kickInProgress;
				if (modifyRolesInProgress !== undefined)
					peer.modifyRolesInProgress = modifyRolesInProgress;
				if (raisedHandInProgress !== undefined)
					peer.raisedHandInProgress = raisedHandInProgress;
				if (raisedHand !== undefined)
					peer.raisedHand = raisedHand;
				if (raisedHandTimestamp !== undefined)
					peer.raisedHandTimestamp = raisedHandTimestamp;
			}
		}),
		addRole: ((state, action: PayloadAction<{ id: string, roleId: number }>) => {
			const { roleId } = action.payload;
			const peer = state.find((p) => p.id === action.payload.id);

			if (peer)
				peer.roles.push(roleId);
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