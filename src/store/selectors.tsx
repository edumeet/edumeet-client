import { createSelector } from 'reselect';
import { MediaDevice } from '../services/deviceService';
import { Transcript } from '../services/mediaService';
import { Permission } from '../utils/roles';
import { StateConsumer } from './slices/consumersSlice';
import { LobbyPeer } from './slices/lobbyPeersSlice';
import { Peer } from './slices/peersSlice';
import { StateProducer } from './slices/producersSlice';
import { RootState } from './store';
import { RoomSession } from './slices/roomSessionsSlice';

// eslint-disable-next-line no-unused-vars
type Selector<S> = (state: RootState) => S;

const mePermissionsSelect: Selector<Permission[]> = (state) => state.permissions.permissions;
const producersSelect: Selector<StateProducer[]> = (state) => state.producers;
const consumersSelect: Selector<StateConsumer[]> = (state) => state.consumers;
const roomSessionsSelect: Selector<Record<string, RoomSession>> = (state) => state.roomSessions;
const peersSelector: Selector<Record<string, Peer>> = (state) => state.peers;
const sessionIdSelector: Selector<string> = (state) => state.me.sessionId;
const lobbyPeersSelector: Selector<LobbyPeer[]> = (state) => state.lobbyPeers;
const unreadMessages: Selector<number> = (state) => state.drawer.unreadMessages;
const unreadFiles: Selector<number> = (state) => state.drawer.unreadFiles;
const lastNSelector: Selector<number> = (state) => state.settings.lastN;
const hideNonVideoSelector: Selector<boolean> = (state) => state.settings.hideNonVideo;
const hideSelfViewSelector: Selector<boolean> = (state) => state.settings.hideSelfView;
const devicesSelector: Selector<MediaDevice[]> = (state) => state.me.devices;

export const isMobileSelector: Selector<boolean> = (state) => state.me.browser.platform === 'mobile';

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
 * Factory function to create a selector that returns the
 * subset of devices that the client has filtered by kind.
 * 
 * @param {string} kind - The kind of devices to return.
 * @returns {Selector<MediaDevice[]>} Selector that returns the subset of devices.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const makeDevicesSelector = (kind: MediaDeviceKind) => {
	return createSelector(
		devicesSelector,
		(devices: MediaDevice[]) => devices.filter((d) => d.kind === kind)
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

/**
 * Returns the list of peerIds that are currently selected or
 * spotlighted. Cropped to lastN if enabled.
 * 
 * @returns {string[]} the list of peerIds.
*/ 
export const spotlightPeersSelector = createSelector(
	lastNSelector,
	currentRoomSessionSelector,
	(lastN, roomSession) => {
		const { spotlights, selectedPeers } = roomSession;

		return selectedPeers.concat(spotlights.filter((item) => selectedPeers.indexOf(item) < 0))
			.slice(0, lastN)
			.sort((a, b) => String(a).localeCompare(String(b)));
	}
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
 * Returns the list of extra video state producers of the client.
 * 
 * @returns {StateProducer[]} the list of video state producers.
 */
export const extraVideoProducersSelector = createSelector(
	producersSelect,
	(producers) => producers.filter((p) => p.source === 'extravideo')
);

/**
 * Returns the mic state producer of the client.
 * 
 * @returns {StateProducer | undefined} the mic state producer.
 */
export const micProducerSelector = createSelector(
	producersSelect,
	(producers) => producers.find((p) => p.source === 'mic')
);

/**
 * Returns the webcam state producer of the client.
 * 
 * @returns {StateProducer | undefined} the webcam state producer.
 */
export const webcamProducerSelector = createSelector(
	producersSelect,
	(producers) => producers.find((p) => p.source === 'webcam')
);

/**
 * Returns the screen state producer of the client.
 * 
 * @returns {StateProducer | undefined} the screen state producer.
 */
export const screenProducerSelector = createSelector(
	producersSelect,
	(producers) => producers.find((p) => p.source === 'screen')
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
	(spotlights, consumers) => consumers.filter((c) => c.source === 'webcam' && spotlights.includes(c.peerId))
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
	(spotlights, consumers) => consumers.filter((c) => c.source === 'screen' && spotlights.includes(c.peerId))
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
	(spotlights, consumers) => consumers.filter((c) => c.source === 'extravideo' && spotlights.includes(c.peerId))
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

		return [
			...raisedHandSortedPeers,
			...spotlightSortedPeers,
			...peersSorted
		];
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
 * Returns the number of peers excluding the client.
 * 
 * @returns {number} the number of peers.
 */
export const peersLengthSelector = createSelector(
	peersArraySelector,
	(peers) => peers.length
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

/**
 * Returns the number of notifications that is a sum of:
 * 1. Number of unread chat messages
 * 2. Number of unviewed files
 * 3. Number of peers that have raised their hand
 * 
 * @returns {number} the number of notifications.
 */
export const unreadSelector = createSelector(
	unreadMessages,
	unreadFiles,
	raisedHandsSelector,
	(messages, files, raisedHands) =>
		messages + files + raisedHands
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
 * Returns the number of visible video tiles in the Democratic view.
 * This is the sum of screen, webcam and extra video tiles, both producers
 * and consumers.
 * 
 * @returns {number} the number of visible video tiles.
 * @see screenProducerSelector
 * @see extraVideoProducersSelector
 * @see spotlightPeersSelector
 * @see spotlightWebcamConsumerSelector
 * @see spotlightScreenConsumerSelector
 * @see spotlightExtraVideoConsumerSelector
 * @see Democratic.tsx
 */
export const videoBoxesSelector = createSelector(
	screenProducerSelector,
	extraVideoProducersSelector,
	spotlightPeersSelector,
	hideNonVideoSelector,
	hideSelfViewSelector,
	spotlightWebcamConsumerSelector,
	spotlightScreenConsumerSelector,
	spotlightExtraVideoConsumerSelector,
	(
		screenProducer,
		extraVideoProducers,
		spotlightPeers,
		hideNonVideo,
		hideSelfView,
		webcamConsumers,
		screenConsumers,
		extraVideoConsumers
	) => {
		let videoBoxes = hideSelfView ? 0 : 1; // Maybe add a box for Me view

		// Add our own screen share, if it exists
		if (screenProducer)
			videoBoxes++;

		// Add any extra video producers we might have
		videoBoxes += extraVideoProducers.length;

		if (hideNonVideo) {
			// If we're hiding non-video, we need to add only the boxes with actual video
			videoBoxes += webcamConsumers.length;
		} else {
			// If we're not hiding non-video, we need to add all the boxes
			videoBoxes += spotlightPeers.length;
		}

		// Add all the screen sharing and extra video boxes of the peers in spotlight
		videoBoxes += screenConsumers.length + extraVideoConsumers.length;

		return videoBoxes;
	});

/**
 * Returns the state consumers of the visible video tiles in the Democratic view.
 * This is the list of screen, webcam and extra video tiles, consumers only.
 * 
 * @returns {StateConsumer[]} the list of state consumers.
 * @see spotlightWebcamConsumerSelector
 * @see spotlightScreenConsumerSelector
 * @see spotlightExtraVideoConsumerSelector
 * @see Democratic.tsx
 */
export const videoConsumersSelector = createSelector(
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

/**
 * Returns the set of mic/webcam/screen/extravideo producers that are
 * currently active in the client.
 * 
 * @returns {{
 * 	micProducer: StateProducer | undefined,
 * 	webcamProducer: StateProducer | undefined,
 * 	screenProducer: StateProducer | undefined,
 * 	extraVideoProducers: StateProducer[]
 * }} the state producers.
 * @see micProducerSelector
 * @see webcamProducerSelector
 * @see screenProducerSelector
 * @see extraVideoProducersSelector
 */
export const meProducersSelector = createSelector(
	micProducerSelector,
	webcamProducerSelector,
	screenProducerSelector,
	extraVideoProducersSelector,
	(micProducer, webcamProducer, screenProducer, extraVideoProducers) =>
		({
			micProducer,
			webcamProducer,
			screenProducer,
			extraVideoProducers
		})
);

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
			const micConsumer = consumers.find((c) => c.peerId === id && c.source === 'mic');
			const webcamConsumer = consumers.find((c) => c.peerId === id && c.source === 'webcam');
			const screenConsumer = consumers.find((c) => c.peerId === id && c.source === 'screen');
			const extraVideoConsumers = consumers.filter((c) => c.peerId === id && c.source === 'extravideo');

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
 * client has the permission.
 * 
 * @param {Permission} permission - The permission.
 * @returns {Selector<boolean>} Selector for the permission.
 */
export const makePermissionSelector = (permission: Permission): Selector<boolean> => createSelector(mePermissionsSelect, (p) => p.includes(permission));