import { createSelector } from 'reselect';
import { MediaDevice } from '../services/deviceService';
import { Transcript } from '../services/mediaService';
import { Permission } from '../utils/roles';
import { StateConsumer } from './slices/consumersSlice';
import { LobbyPeer } from './slices/lobbyPeersSlice';
import { Peer } from './slices/peersSlice';
import { RootState } from './store';
import { RoomSession } from './slices/roomSessionsSlice';
import { MeState } from './slices/meSlice';

// eslint-disable-next-line no-unused-vars
type Selector<S> = (state: RootState) => S;

const meSelector: Selector<MeState> = (state) => state.me;
const mePermissionsSelect: Selector<Permission[]> = (state) => state.permissions.permissions;
const consumersSelect: Selector<StateConsumer[]> = (state) => state.consumers;
const roomSessionsSelect: Selector<Record<string, RoomSession>> = (state) => state.roomSessions;
const peersSelector: Selector<Record<string, Peer>> = (state) => state.peers;
const sessionIdSelector: Selector<string> = (state) => state.me.sessionId;
const lobbyPeersSelector: Selector<LobbyPeer[]> = (state) => state.lobbyPeers;
const maxActiveVideosSelector: Selector<number> = (state) => state.settings.maxActiveVideos;
const hideNonVideoSelector: Selector<boolean> = (state) => state.settings.hideNonVideo;
const hideSelfViewSelector: Selector<boolean> = (state) => state.settings.hideSelfView;
const devicesSelector: Selector<MediaDevice[]> = (state) => state.me.devices;
const headlessSelector: Selector<boolean | undefined> = (state) => state.room.headless;
const recordingSelector: Selector<boolean | undefined> = (state) => state.room.recording;

export const isMobileSelector: Selector<boolean> = (state) => state.me.browser.platform === 'mobile';

export const canSelectAudioOutput: Selector<boolean> = (state) => {
	const { name, version } = state.me.browser;

	return name === 'chrome' && Number.parseInt(version) >= 110 && 'setSinkId' in HTMLAudioElement.prototype;
};

/**
 * Returns the peers as an array.
 * 
 * @returns {Peer[]} the peers.
 */
export const peersArraySelector = createSelector(
	peersSelector,
	(peers) => Object.values(peers)
);

/**
 * Returns the number of peers excluding the client.
 * 
 * @returns {number} the number of peers.
 */
export const peersLengthSelector = createSelector(
	peersArraySelector,
	(peers) => peers.length
);

export const roomSessionsArraySelector = createSelector(
	roomSessionsSelect,
	(roomSessions) => Object.values(roomSessions)
);

export const roomSessionsLengthSelector = createSelector(
	roomSessionsArraySelector,
	(roomSessions) => roomSessions.length
);

export const p2pModeSelector = createSelector(
	roomSessionsLengthSelector,
	peersLengthSelector,
	(sessions, peers) => sessions === 1 && peers < 2
);

/**
 * Factory function to create a selector that returns the
 * subset of devices that the client has filtered by kind.
 * 
 * @param {string} kind - The kind of devices to return.
 * @returns {Selector<MediaDevice[]>} Selector that returns the subset of devices.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const makeDevicesSelector = (kind: MediaDeviceKind, excludedDeviceId?: string) => {
	return createSelector(
		devicesSelector,
		(devices: MediaDevice[]) => devices.filter((d) => (d.kind === kind) && (d.deviceId !== excludedDeviceId))
	);
};

/**
 * Returns the parent sessionId.
 * 
 * @returns {string | undefined} the parent sessionId.
 */
export const parentRoomSessionIdSelector = createSelector(
	roomSessionsSelect,
	(roomSessions) => Object.values(roomSessions).find((roomSession) => roomSession.parent)?.sessionId
);

/**
 * Returns the list of peers that has the same sessionId as me.
 * 
 * @returns {Peer[]} the list of peers.
 */
export const sessionIdPeersSelector = createSelector(
	sessionIdSelector,
	peersArraySelector,
	(sessionId, peers) => peers.filter((p) => p.sessionId === sessionId)
);

/**
 * Returns the list of peers that are in the parent room.
 * 
 * @returns {Peer[]} the list of peers.
 */
export const parentRoomPeersSelector = createSelector(
	parentRoomSessionIdSelector,
	peersArraySelector,
	(parentRoomSessionId, peers) => peers.filter((p) => p.sessionId === parentRoomSessionId)
);

/**
 * Returns the current roomSession that I am in.
 * 
 * @returns {RoomSession} the roomSession.
 */
export const currentRoomSessionSelector = createSelector(
	sessionIdSelector,
	roomSessionsSelect,
	(sessionId, roomSessions) => roomSessions[sessionId]
);

/**
 * Returns the spotlights for the roomSession that I am in.
 * 
 * @returns {string[]} the list of peerIds.
 */
export const sessionIdSpotlightsSelector = createSelector(
	currentRoomSessionSelector,
	(roomSession) => roomSession.spotlights
);

export const sessionIdSpotlightedConsumerSelector = createSelector(
	currentRoomSessionSelector,
	consumersSelect,
	(roomSession, consumers) => consumers.filter((c) => roomSession.spotlights.includes(c.id))
);

const consumerSelectedPeerIdsSelector = createSelector(
	consumersSelect,
	(consumers) => consumers.filter((c) => c.source === 'screen' || c.source === 'extravideo').map((c) => c.peerId)
);

/**
 * Returns the list of peerIds that are currently selected or
 * spotlighted. Cropped to maxActiveVideos.
 * 
 * @returns {string[]} the list of peerIds.
*/ 
export const spotlightPeersSelector = createSelector(
	maxActiveVideosSelector,
	currentRoomSessionSelector,
	consumerSelectedPeerIdsSelector,
	(maxActiveVideos, roomSession, consumerSelectedPeerIds) => {
		const { spotlights, selectedPeers } = roomSession;
		const uniqueSet = Array.from(new Set([ ...consumerSelectedPeerIds, ...selectedPeers, ...spotlights ]));

		return uniqueSet.slice(0, maxActiveVideos).sort((a, b) => String(a).localeCompare(String(b)));
	}
);

/**
 * Returns the active speaker for the roomSession that I am in.
 * 
 * @returns {string | undefined} the peerId.
 */
export const activeSpeakerIdSelector = createSelector(
	currentRoomSessionSelector,
	(roomSession) => roomSession.activeSpeakerId
);

/**
 * Returns the list of rooms that are not parent rooms.
 * 
 * @returns {RoomSession[]} the list of rooms.
 */
export const breakoutRoomsSelector = createSelector(
	roomSessionsSelect,
	(roomSessions) => Object.values(roomSessions).filter((roomSession) => !roomSession.parent)
);

/**
 * Returns the list of mic state consumers of all peers.
 * 
 * @returns {StateConsumer[]} the list of mic state consumers.
 */
export const micConsumerSelector = createSelector(
	consumersSelect,
	(consumers) => consumers.filter((c) => c.source === 'mic')
);

/**
 * Returns the list of webcam state consumers of the peers that are
 * currently selected or spotlighted.
 * 
 * @returns {StateConsumer[]} the list of webcam state consumers.
 * @see spotlightPeersSelector
 */
export const spotlightWebcamConsumerSelector = createSelector(
	spotlightPeersSelector,
	consumersSelect,
	(spotlights, consumers) => consumers.filter(
		(c) => c.source === 'webcam' && !c.remotePaused && spotlights.includes(c.peerId)
	)
);

/**
 * Returns the list of screen state consumers of the peers that are
 * currently selected or spotlighted.
 * 
 * @returns {StateConsumer[]} the list of screen state consumers.
 * @see spotlightPeersSelector
 */
export const spotlightScreenConsumerSelector = createSelector(
	spotlightPeersSelector,
	consumersSelect,
	(spotlights, consumers) => consumers.filter(
		(c) => c.source === 'screen' && !c.remotePaused && spotlights.includes(c.peerId)
	)
);

/**
 * Returns the list of extra video state consumers of the peers that are
 * currently selected or spotlighted.
 * 
 * @returns {StateConsumer[]} the list of extra video state consumers.
 * @see spotlightPeersSelector
 */
export const spotlightExtraVideoConsumerSelector = createSelector(
	spotlightPeersSelector,
	consumersSelect,
	(spotlights, consumers) => consumers.filter(
		(c) => c.source === 'extravideo' && !c.remotePaused && spotlights.includes(c.peerId)
	)
);

/**
 * Returns the list of all peerIds sorted by:
 * 1. Raised hand (and time they raised it)
 * 2. Spotlight and selected
 * 3. All the rest
 * 
 * @returns {string[]} the list of peerIds.
 * @see spotlightPeersSelector
 */
export const parentParticipantListSelector = createSelector(
	[ parentRoomPeersSelector, sessionIdSpotlightsSelector ],
	(peers, spotlights) => {
		const raisedHandSortedPeers =
			peers.filter((peer) => peer.raisedHand)
				.sort((a, b) => 
					(a.raisedHandTimestamp || 0) -
					(b.raisedHandTimestamp || 0)
				);
		const spotlightSortedPeers =
			peers.filter((peer) => spotlights.includes(peer.id) && !peer.raisedHand)
				.sort((a, b) => String(a.displayName || '')
					.localeCompare(String(b.displayName || ''))
				);
		const peersSorted =
			peers.filter((peer) => !spotlights.includes(peer.id) && !peer.raisedHand)
				.sort((a, b) => String(a.displayName || '')
					.localeCompare(String(b.displayName || ''))
				);

		return [ ...raisedHandSortedPeers, ...spotlightSortedPeers, ...peersSorted ];
	}
);

/** Returns true if I am in parent session.
 * 
 * @returns {boolean} true if I am in parent session.
 */
export const inParentRoomSelector = createSelector(
	sessionIdSelector,
	roomSessionsSelect,
	(sessionId, roomSessions) => Object.values(roomSessions).find((rs) => rs.sessionId === sessionId)?.parent
);

/**
 * Returns the number of shared files.
 * 
 * @returns {number} the number of shared files.
 */
export const filesLengthSelector = createSelector(
	currentRoomSessionSelector,
	(roomSession) => roomSession.fileHistory.length
);

/**
 * Returns the list of shared files.
 * 
 * @returns {File[]} the list of shared files.
 */
export const filesSelector = createSelector(
	currentRoomSessionSelector,
	(roomSession) => roomSession.fileHistory
);

/**
 * Returns the chat messages of the current roomSession I am in.
 * 
 * @returns {ChatMessage[]} the chat messages.
 */
export const chatMessagesSelector = createSelector(
	currentRoomSessionSelector,
	(roomSession) => roomSession.chatHistory
);

/**
 * Returns the creationTimestamp of the roomSession I am in.
 * 
 * @returns {number} the creationTimestamp.
 */
export const roomSessionCreationTimestampSelector = createSelector(
	currentRoomSessionSelector,
	(roomSession) => roomSession.creationTimestamp
);

/**
 * Returns the number of peers in the lobby.
 * 
 * @returns {number} the number of peers in the lobby.
 */
export const lobbyPeersLengthSelector = createSelector(
	lobbyPeersSelector,
	(peers) => peers.length
);

/**
 * Returns the number of peers that have raised their hand.
 * 
 * @returns {number} the number of peers that have raised their hand.
 */
export const raisedHandsSelector = createSelector(
	peersArraySelector,
	(peers) => peers.reduce((a, b) => (a + (b.raisedHand ? 1 : 0)), 0)
);

export const someoneIsRecordingSelector = createSelector(
	sessionIdPeersSelector,
	recordingSelector,
	(peers, recording) => recording || peers.some((peer) => peer.recording)
);

/**
 * Returns the one state consumer that is currently in fullscreen
 * in the main window.
 * 
 * @returns {StateConsumer | undefined} the state consumer.
 */
export const fullscreenConsumerSelector = createSelector(
	currentRoomSessionSelector,
	consumersSelect,
	(roomSession, consumers) => consumers.find((c) => c.id === roomSession.fullscreenConsumer)
);

/**
 * Returns the list of state consumers that are currently in a
 * separate window.
 * 
 * @returns {StateConsumer[]} the list of state consumers.
 */
export const windowedConsumersSelector = createSelector(
	currentRoomSessionSelector,
	consumersSelect,
	(roomSession, consumers) => consumers.filter((c) => roomSession.windowedConsumers.includes(c.id))
);

/**
 * Returns the list of audio state consumers of all peers.
 * 
 * @returns {StateConsumer[]} the list of audio state consumers.
 */
export const audioConsumerSelector = createSelector(
	consumersSelect,
	(consumers) => consumers.filter((c) => c.kind === 'audio')
);

/**
 * Returns the state consumers of all the visible video tiles.
 * This is the list of screen, webcam and extra video tiles, consumers only.
 * 
 * @returns {StateConsumer[]} the list of state consumers.
 * @see spotlightWebcamConsumerSelector
 * @see spotlightScreenConsumerSelector
 * @see spotlightExtraVideoConsumerSelector
 * @see Democratic.tsx
 */
export const resumedVideoConsumersSelector = createSelector(
	spotlightWebcamConsumerSelector,
	spotlightScreenConsumerSelector,
	spotlightExtraVideoConsumerSelector,
	fullscreenConsumerSelector,
	windowedConsumersSelector,
	(
		webcamConsumers,
		screenConsumers,
		extraVideoConsumers,
		fullscreenedConsumer,
		newWindowedConsumers
	) => {
		let consumers: StateConsumer[];

		// If we have a fullscreen consumer, all other consumers are
		// invisible except for a possible windowed consumer.
		if (fullscreenedConsumer)
			consumers = [ fullscreenedConsumer ];
		else {
			consumers = [
				...webcamConsumers,
				...screenConsumers,
				...extraVideoConsumers
			];
		}

		consumers.push(...newWindowedConsumers);

		return consumers;
	}
);

export const selectedVideoConsumersSelector = createSelector(
	spotlightScreenConsumerSelector,
	spotlightExtraVideoConsumerSelector,
	(screenConsumers, extraVideoConsumers) => ([
		...screenConsumers,
		...extraVideoConsumers,
	])
);

/**
 * Returns the list of peers without a webcam consumer.
 * 
 * @returns {Peer[]} the list of peerIds.
 */
export const audioOnlySessionPeersSelector = createSelector(
	sessionIdPeersSelector,
	resumedVideoConsumersSelector,
	(peers, consumers) => peers.filter((peer) => !consumers.some((c) => c.peerId === peer.id))
);

/** Returns true if the current active speaker is an audio only peer.
 * 
 * @returns {boolean} true if the current speaker is an audio only peer.
 */
export const activeSpeakerIsAudioOnlySelector = createSelector(
	audioOnlySessionPeersSelector,
	activeSpeakerIdSelector,
	(audioOnlyPeers, activeSpeakerId) => audioOnlyPeers.some((peer) => peer.id === activeSpeakerId)
);

/**
 * Returns the number of visible video tiles in the Democratic view.
 * This is the sum of screen, webcam and extra video tiles, both producers
 * and consumers.
 * 
 * @returns {number} the number of visible video tiles.
 * @see screenProducerSelector
 * @see extraVideoProducerSelector
 * @see spotlightPeersSelector
 * @see spotlightWebcamConsumerSelector
 * @see spotlightScreenConsumerSelector
 * @see spotlightExtraVideoConsumerSelector
 * @see Democratic.tsx
 */
export const videoBoxesSelector = createSelector(
	hideSelfViewSelector,
	spotlightWebcamConsumerSelector,
	audioOnlySessionPeersSelector,
	hideNonVideoSelector,
	headlessSelector,
	(
		hideSelfView,
		webcamConsumers,
		audioOnlyPeers,
		hideNonVideo,
		headless,
	) => {
		let videoBoxes = hideSelfView ? 0 : 1; // Maybe add a box for Me view

		// Add everyone else's video
		videoBoxes += webcamConsumers.length;

		if (audioOnlyPeers.length > 0 && !hideNonVideo && !headless) videoBoxes++; // Add the audio only box

		return videoBoxes;
	});

export const selectedVideoBoxesSelector = createSelector(
	meSelector,
	spotlightScreenConsumerSelector,
	spotlightExtraVideoConsumerSelector,
	(
		{ screenEnabled, extraVideoEnabled },
		screenConsumers,
		extraVideoConsumers,
	) => {
		let videoBoxes = 0;

		// Add our own screen share, if it exists
		if (screenEnabled) videoBoxes++;
		if (extraVideoEnabled) videoBoxes++;

		// Add everyone else's video
		videoBoxes += screenConsumers.length + extraVideoConsumers.length;

		return videoBoxes;
	});

/**
 * Factory function that returns a selector that returns a peer.
 * 
 * @param {string} id - The peer ID.
 * @returns {Selector<Peer | undefined>} Selector for the peer.
 */
export const makePeerSelector = (id: string): Selector<Peer | undefined> => {
	return createSelector(peersSelector, (peers) => peers[id]);
};

/**
 * Factory function that returns a selector that returns the list of peers that are in a sessionId.
 * 
 * @param {string} sessionId - The sessionId.
 * @returns {Selector<Peer[]>} Selector for the peers.
 */
export const makePeersInSessionSelector = (sessionId: string): Selector<Peer[]> => {
	return createSelector(peersArraySelector, (peers) => peers.filter((p) => p.sessionId === sessionId));
};

/**
 * Factory function that returns a selector that returns the array of
 * transcripts for a given peer.
 * 
 * @param {string} id - The peer ID.
 * @returns {Selector<PeerTranscript[]>} Selector for the transcripts.
 */
export const makePeerTranscriptsSelector = (id: string): Selector<Transcript[]> => {
	return createSelector(peersSelector, (peers) => peers[id]?.transcripts ?? []);
};

/**
 * Factory function that returns a selector that returns the set of
 * mic/webcam/screen/extravideo consumers for a given peer.
 * 
 * @param {string} id - The peer ID.
 * @returns {Selector<{
 * 	micConsumer: StateConsumer | undefined,
 * 	webcamConsumer: StateConsumer | undefined,
 * 	screenConsumer: StateConsumer | undefined,
 * 	extraVideoConsumers: StateConsumer[]
 * }>} Selector for the peer's consumers.
 */
export const makePeerConsumerSelector = (id: string): Selector<{
	micConsumer: StateConsumer | undefined;
	webcamConsumer: StateConsumer | undefined;
	screenConsumer: StateConsumer | undefined;
	extraVideoConsumers: StateConsumer[];
}> => {
	return createSelector(
		consumersSelect,
		(consumers: StateConsumer[]) => {
			const micConsumer = consumers.find((c) => c.peerId === id && c.source === 'mic' && !c.remotePaused);
			const webcamConsumer = consumers.find((c) => c.peerId === id && c.source === 'webcam' && !c.remotePaused);
			const screenConsumer = consumers.find((c) => c.peerId === id && c.source === 'screen' && !c.remotePaused);
			const extraVideoConsumers = consumers.filter((c) => c.peerId === id && c.source === 'extravideo' && !c.remotePaused);

			return { micConsumer, webcamConsumer, screenConsumer, extraVideoConsumers };
		}
	);
};

export interface PeerConsumers {
	micConsumer?: StateConsumer;
	webcamConsumer?: StateConsumer;
	screenConsumer?: StateConsumer;
	extraVideoConsumers: StateConsumer[];
}

/**
 * Factory function that returns a selector that returns true if the
 * id matches active speaker in session.
 * 
 * @param {string} id - The permission.
 * @returns {boolean} true if id matches the active speaker.
 */
export const makeIsActiveSpeakerSelector = (id: string): Selector<boolean> => {
	return createSelector(
		sessionIdSelector,
		roomSessionsSelect,
		(sessionId, roomSessions) => {
			return roomSessions[sessionId].activeSpeakerId === id;
		}
	);
};

export const makePermissionSelector = (permission: Permission): Selector<boolean> => createSelector(mePermissionsSelect, (p) => p.includes(permission));
