import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PeerTranscript, Transcript } from '../../services/mediaService';
import { roomActions } from './roomSlice';

export interface Peer {
	id: string;
	sessionId: string;
	displayName?: string;
	picture?: string;
	videoInProgress?: boolean;
	stopVideoInProgress?: boolean;
	audioInProgress?: boolean;
	stopAudioInProgress?: boolean;
	screenInProgress?: boolean;
	stopScreenSharingInProgress?: boolean;
	kickInProgress?: boolean;
	raisedHandInProgress?: boolean;
	raisedHand?: boolean;
	raisedHandTimestamp?: number;
	reactionInProgress?: boolean;
	reaction?: string | null;
	reactionTimestamp?: number;
	recording?: boolean;
	headless?: boolean;
	// Holds MODERATE_ROOM, as the server tells everyone, so the participant list can show who controls the room
	moderator?: boolean;
	transcripts?: Transcript[];
}

type PeerUpdate = Omit<Peer, 'sessionId' | 'transcripts'>;

const initialState: Record<string, Peer> = {};

// Peer ids come from other participants. One that names an Object.prototype property
// (__proto__, constructor, ...) must neither be stored nor resolve to the prototype.
const isSafeId = (id: unknown): id is string => typeof id === 'string' && !(id in Object.prototype);
const ownPeer = (state: Record<string, Peer>, id: string): Peer | undefined =>
	(Object.hasOwn(state, id) ? state[id] : undefined);

const peersSlice = createSlice({
	name: 'peers',
	initialState,
	reducers: {
		addPeer: ((state, action: PayloadAction<Peer>) => {
			if (isSafeId(action.payload.id)) state[action.payload.id] = action.payload;
		}),
		addPeers: ((state, action: PayloadAction<Peer[]>) => {
			for (const peer of action.payload) {
				if (isSafeId(peer.id)) state[peer.id] = peer;
			}
		}),
		removePeer: ((state, action: PayloadAction<{ id: string }>) => {
			if (ownPeer(state, action.payload.id)) delete state[action.payload.id];
		}),
		setPeerSessionId: ((state, action: PayloadAction<{ id: string, sessionId: string, oldSessionId: string }>) => {
			const peer = ownPeer(state, action.payload.id);

			if (peer)
				peer.sessionId = action.payload.sessionId;
		}),
		updatePeer: ((state, action: PayloadAction<PeerUpdate>) => {
			const peer = ownPeer(state, action.payload.id);

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
					raisedHandInProgress,
					raisedHand,
					raisedHandTimestamp,
					reactionInProgress,
					reaction,
					reactionTimestamp,
					recording,
					moderator,
				} = action.payload;

				if (moderator !== undefined)
					peer.moderator = moderator;

				if (displayName)
					peer.displayName = displayName;
				if (picture && typeof picture === 'string')
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
				if (raisedHandInProgress !== undefined)
					peer.raisedHandInProgress = raisedHandInProgress;
				if (raisedHand !== undefined)
					peer.raisedHand = raisedHand;
				if (raisedHandTimestamp !== undefined)
					peer.raisedHandTimestamp = raisedHandTimestamp;
				if (reactionInProgress !== undefined)
					peer.reactionInProgress = reactionInProgress;
				if (reaction !== undefined)
					peer.reaction = reaction;
				if (reactionTimestamp !== undefined)
					peer.reactionTimestamp = reactionTimestamp;
				if (recording !== undefined)
					peer.recording = recording;
			}
		}),
		updateTranscript: ((state, action: PayloadAction<PeerTranscript>) => {
			const { id, transcript, peerId, done } = action.payload;
			const peer = ownPeer(state, peerId);

			if (peer) {
				if (!peer.transcripts)
					peer.transcripts = [];

				const oldTranscript = peer.transcripts.find((t) => t.id === id);

				if (oldTranscript) {
					oldTranscript.transcript = transcript;
					oldTranscript.done = done;
				} else {
					const newTranscript = { id, transcript, done };

					peer.transcripts.push(newTranscript);
				}
			}
		}),
		removeTranscript: ((state, action: PayloadAction<Omit<PeerTranscript, 'transcript' | 'done'>>) => {
			const { id, peerId } = action.payload;
			const peer = ownPeer(state, peerId);

			if (peer) {
				peer.transcripts =
					peer.transcripts?.filter((t) => t.id !== id);
			}
		}),
		clearTranscripts: ((state, action: PayloadAction<string>) => {
			const peer = ownPeer(state, action.payload);

			if (peer)
				peer.transcripts = [];
		}),
		removeAllPeers: (() => {
			return initialState;
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(roomActions.setState, (_state, action) => {
				if (action.payload === 'left')
					return initialState;
			});
	}
});

export const peersActions = peersSlice.actions;
export default peersSlice;
