import { createSelector } from 'reselect';
import { MediaDevice } from '../services/deviceService';
import { Transcript } from '../services/mediaService';
import { Permission, Role } from '../utils/roles';
import { StateConsumer } from './slices/consumersSlice';
import { FilesharingFile } from './slices/filesharingSlice';
import { LobbyPeer } from './slices/lobbyPeersSlice';
import { Peer } from './slices/peersSlice';
import { StateProducer } from './slices/producersSlice';
import { RootState } from './store';

// eslint-disable-next-line no-unused-vars
type Selector<S> = (state: RootState) => S;

const meRolesSelect: Selector<number[]> =
	(state) => state.permissions.roles;
const roomPermissionsSelect: Selector<Record<Permission, Role[]> | undefined> =
	(state) => state.permissions.roomPermissions;
const roomAllowWhenRoleMissing: Selector<Permission[] | undefined> =
	(state) => state.permissions.allowWhenRoleMissing;
const producersSelect: Selector<StateProducer[]> =
	(state) => state.producers;
const consumersSelect: Selector<StateConsumer[]> =
	(state) => state.consumers;
const spotlightsSelector: Selector<string[]> =
	(state) => state.room.spotlights;
const selectedPeersSelector: Selector<string[]> =
	(state) => state.room.selectedPeers;
const peersSelector: Selector<Peer[]> =
	(state) => state.peers;
const filesSelector: Selector<FilesharingFile[]> =
	(state) => state.filesharing;
const lobbyPeersSelector: Selector<LobbyPeer[]> =
	(state) => state.lobbyPeers;
const unreadMessages: Selector<number> = (state) => state.drawer.unreadMessages;
const unreadFiles: Selector<number> = (state) => state.drawer.unreadFiles;
const lastNSelector: Selector<number> = (state) => state.settings.lastN;
const hideNonVideoSelector: Selector<boolean> = (state) => state.settings.hideNonVideo;
const devicesSelector: Selector<MediaDevice[]> = (state) => state.me.devices;
const fullscreenConsumer: Selector<string | undefined> =
	(state) => state.room.fullscreenConsumer;
const windowedConsumers: Selector<string[]> =
	(state) => state.room.windowedConsumers;

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
		(devices: MediaDevice[]) =>
			devices.filter((device) => device.kind === kind)
	);
};

/**
 * Returns the list of peerIds that are currently selected or
 * spotlighted. Cropped to lastN if enabled.
 * 
 * @returns {string[]} the list of peerIds.
 */
export const spotlightPeersSelector = createSelector(
	lastNSelector,
	selectedPeersSelector,
	spotlightsSelector,
	(lastN, selectedPeers, spotlights) =>
		selectedPeers.concat(
			spotlights.filter((item) => selectedPeers.indexOf(item) < 0)
		).slice(0, lastN)
			.sort((a, b) => String(a)
				.localeCompare(String(b)))
);

/**
 * Returns the list of extra video state producers of the client.
 * 
 * @returns {StateProducer[]} the list of video state producers.
 */
export const extraVideoProducersSelector = createSelector(
	producersSelect,
	(producers) => producers.filter((producer) => producer.source === 'extravideo')
);

/**
 * Returns the mic state producer of the client.
 * 
 * @returns {StateProducer | undefined} the mic state producer.
 */
export const micProducerSelector = createSelector(
	producersSelect,
	(producers) => producers.find((producer) => producer.source === 'mic')
);

/**
 * Returns the webcam state producer of the client.
 * 
 * @returns {StateProducer | undefined} the webcam state producer.
 */
export const webcamProducerSelector = createSelector(
	producersSelect,
	(producers) => producers.find((producer) => producer.source === 'webcam')
);

/**
 * Returns the screen state producer of the client.
 * 
 * @returns {StateProducer | undefined} the screen state producer.
 */
export const screenProducerSelector = createSelector(
	producersSelect,
	(producers) => producers.find((producer) => producer.source === 'screen')
);

/**
 * Returns the list of mic state consumers of all peers.
 * 
 * @returns {StateConsumer[]} the list of mic state consumers.
 */
export const micConsumerSelector = createSelector(
	consumersSelect,
	(consumers) => consumers.filter((consumer) => consumer.source === 'mic')
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
	(spotlights, consumers) =>
		consumers.filter(
			(consumer) => consumer.source === 'webcam' && spotlights.includes(consumer.peerId)
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
	(spotlights, consumers) =>
		consumers.filter(
			(consumer) => consumer.source === 'screen' && spotlights.includes(consumer.peerId)
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
	(spotlights, consumers) =>
		consumers.filter(
			(consumer) => consumer.source === 'extravideo' && spotlights.includes(consumer.peerId)
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
export const participantListSelector = createSelector(
	[ spotlightsSelector, peersSelector ],
	(spotlights, peers) => {
		const raisedHandSortedPeers =
			peers.filter((peer) => peer.raisedHand)
				.sort((a, b) => 
					(a.raisedHandTimestamp?.getTime() || 0) -
					(b.raisedHandTimestamp?.getTime() || 0)
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

/**
 * Returns the number of shared files.
 * 
 * @returns {number} the number of shared files.
 */
export const filesLengthSelector = createSelector(
	filesSelector,
	(files) => files.length
);

/**
 * Returns the number of peers excluding the client.
 * 
 * @returns {number} the number of peers.
 */
export const peersLengthSelector = createSelector(
	peersSelector,
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
	peersSelector,
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
	fullscreenConsumer,
	consumersSelect,
	(consumer, consumers) =>
		consumers.find((c) => c.id === consumer)
);

/**
 * Returns the list of state consumers that are currently in a
 * separate window.
 * 
 * @returns {StateConsumer[]} the list of state consumers.
 */
export const windowedConsumersSelector = createSelector(
	windowedConsumers,
	consumersSelect,
	(windowConsumers, consumers) =>
		consumers.filter((c) => windowConsumers.includes(c.id))
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
	spotlightWebcamConsumerSelector,
	spotlightScreenConsumerSelector,
	spotlightExtraVideoConsumerSelector,
	(
		screenProducer,
		extraVideoProducers,
		spotlightPeers,
		hideNonVideo,
		webcamConsumers,
		screenConsumers,
		extraVideoConsumers
	) => {
		let videoBoxes = 1; // Always add a box for Me view

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
	return createSelector(
		peersSelector,
		(peers: Peer[]) => peers.find((peer) => peer.id === id)
	);
};

/**
 * Factory function that returns a selector that returns the array of
 * transcripts for a given peer.
 * 
 * @param {string} id - The peer ID.
 * @returns {Selector<PeerTranscript[]>} Selector for the transcripts.
 */
export const makePeerTranscriptsSelector = (id: string): Selector<Transcript[]> => {
	return createSelector(
		peersSelector,
		(peers: Peer[]) => peers.find((peer) => peer.id === id)?.transcripts || []
	);
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
			const micConsumer =
				consumers.find((consumer) => consumer.peerId === id && consumer.source === 'mic');
			const webcamConsumer =
				consumers.find((consumer) => consumer.peerId === id && consumer.source === 'webcam');
			const screenConsumer =
				consumers.find((consumer) => consumer.peerId === id && consumer.source === 'screen');
			const extraVideoConsumers =
				consumers.filter((consumer) => consumer.peerId === id && consumer.source === 'extravideo');

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
export const makePermissionSelector =
	(permission: Permission): Selector<boolean> => {
		return createSelector(
			meRolesSelect,
			roomPermissionsSelect,
			roomAllowWhenRoleMissing,
			peersSelector,
			(roles, roomPermissions, allowWhenRoleMissing, peers) => {
				if (!roomPermissions)
					return false;

				const permitted = roles.some((roleId) =>
					roomPermissions[permission].some((permissionRole: Role) =>
						roleId === permissionRole.id
					)
				);

				if (permitted)
					return true;

				if (!allowWhenRoleMissing)
					return false;

				// Allow if config is set, and no one is present
				if (allowWhenRoleMissing.includes(permission) &&
					peers.filter(
						(peer) =>
							peer.roles.some(
								(roleId) => roomPermissions[permission].some((permissionRole) =>
									roleId === permissionRole.id
								)
							)
					).length === 0
				)
					return true;

				return false;
			}
		);
	};