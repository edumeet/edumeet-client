import { createSelector } from 'reselect';
import { MediaDevice } from '../services/deviceService';
import { Permission, Role } from '../utils/roles';
import { FilesharingFile } from '../utils/types';
import { StateConsumer } from './slices/consumersSlice';
import { LobbyPeer } from './slices/lobbyPeersSlice';
import { Peer } from './slices/peersSlice';
import { StateProducer } from './slices/producersSlice';
import { RootState } from './store';

// eslint-disable-next-line no-unused-vars
type Selector<S> = (state: RootState) => S;
// eslint-disable-next-line no-unused-vars
type ParameterSelector<S> = (state: RootState, param: string) => S;

const meRolesSelect: Selector<number[]> =
	(state) => state.permissions.roles;
const userRolesSelect: Selector<Record<number, Role> | undefined> =
	(state) => state.permissions.userRoles;
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
const peerSelector: ParameterSelector<Peer | undefined> =
	(state: RootState, peerId: string) => state.peers.find((p: Peer) => p.id === peerId);
const lobbyPeersSelector: Selector<LobbyPeer[]> =
	(state) => state.lobbyPeers;
const unreadMessages: Selector<number> = (state) => state.drawer.unreadMessages;
const unreadFiles: Selector<number> = (state) => state.drawer.unreadFiles;
const lastNSelector: Selector<number> = (state) => state.settings.lastN;
const hideNonVideoSelector: Selector<boolean> = (state) => state.settings.hideNonVideo;
const devicesSelector: Selector<MediaDevice[]> = (state) => state.me.devices;
const fullscreenConsumer: Selector<string | undefined> =
	(state) => state.room.fullscreenConsumer;
const windowedConsumer: Selector<string | undefined> =
	(state) => state.room.windowedConsumer;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const makeDevicesSelector = (kind: MediaDeviceKind) => {
	return createSelector(
		devicesSelector,
		(devices: MediaDevice[]) =>
			devices.filter((device) => device.kind === kind)
	);
};

export const spotlightPeersSelector = createSelector(
	lastNSelector,
	selectedPeersSelector,
	spotlightsSelector,
	(lastN, selectedPeers, spotlights) =>
		selectedPeers.concat(
			spotlights.filter((item) => selectedPeers.indexOf(item) < 0)
		).slice(0, lastN)
);

export const peersVideoConsumersSelector = createSelector(
	spotlightPeersSelector,
	consumersSelect,
	(spotlightPeers, consumers) =>
		consumers.filter((consumer) =>
			consumer.kind === 'video' && spotlightPeers.includes(consumer.peerId))
);

export const passivePeersVideoConsumersSelector = createSelector(
	spotlightPeersSelector,
	consumersSelect,
	(spotlightPeers, consumers) =>
		consumers.filter((consumer) =>
			consumer.kind === 'video' && !spotlightPeers.includes(consumer.peerId))
);

export const extraVideoProducersSelector = createSelector(
	producersSelect,
	(producers) => producers.filter((producer) => producer.source === 'extravideo')
);

export const micProducerSelector = createSelector(
	producersSelect,
	(producers) => producers.find((producer) => producer.source === 'mic')
);

export const webcamProducerSelector = createSelector(
	producersSelect,
	(producers) => producers.find((producer) => producer.source === 'webcam')
);

export const screenProducerSelector = createSelector(
	producersSelect,
	(producers) => producers.find((producer) => producer.source === 'screen')
);

export const micConsumerSelector = createSelector(
	consumersSelect,
	(consumers) => consumers.filter((consumer) => consumer.source === 'mic')
);

export const webcamConsumerSelector = createSelector(
	consumersSelect,
	(consumers) => consumers.filter((consumer) => consumer.source === 'webcam')
);

export const screenConsumerSelector = createSelector(
	consumersSelect,
	(consumers) => consumers.filter((consumer) => consumer.source === 'screen')
);

export const spotlightWebcamConsumerSelector = createSelector(
	spotlightPeersSelector,
	consumersSelect,
	(spotlights, consumers) =>
		consumers.filter(
			(consumer) => consumer.source === 'webcam' && spotlights.includes(consumer.peerId)
		)
);

export const spotlightScreenConsumerSelector = createSelector(
	spotlightPeersSelector,
	consumersSelect,
	(spotlights, consumers) =>
		consumers.filter(
			(consumer) => consumer.source === 'screen' && spotlights.includes(consumer.peerId)
		)
);

export const spotlightExtraVideoConsumerSelector = createSelector(
	spotlightPeersSelector,
	consumersSelect,
	(spotlights, consumers) =>
		consumers.filter(
			(consumer) => consumer.source === 'extravideo' && spotlights.includes(consumer.peerId)
		)
);

export const passiveMicConsumerSelector = createSelector(
	spotlightsSelector,
	consumersSelect,
	(spotlights, consumers) =>
		consumers.filter(
			(consumer) => consumer.source === 'mic' && !spotlights.includes(consumer.peerId)
		)
);

export const highestRoleLevelSelector = createSelector(
	meRolesSelect,
	userRolesSelect,
	(roles, userRoles) => {
		let level = 0;

		for (const role of roles) {
			const tmpLevel = userRoles?.[role]?.level;

			if (tmpLevel && tmpLevel > level)
				level = tmpLevel;
		}

		return level;
	}
);

export const spotlightsLengthSelector = createSelector(
	spotlightsSelector,
	(spotlights) => spotlights.length
);

export const spotlightSortedPeersSelector = createSelector(
	spotlightsSelector,
	peersSelector,
	(spotlights, peers) =>
		peers.filter((peer) => spotlights.includes(peer.id) && !peer.raisedHand)
			.sort((a, b) => String(a.displayName || '')
				.localeCompare(String(b.displayName || ''))
			)
);

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

export const filesLengthSelector = createSelector(
	filesSelector,
	(files) => files.length
);

export const peersLengthSelector = createSelector(
	peersSelector,
	(peers) => peers.length
);

export const lobbyPeersLengthSelector = createSelector(
	lobbyPeersSelector,
	(peers) => peers.length
);

export const passivePeersSelector = createSelector(
	spotlightsSelector,
	peersSelector,
	(spotlights, peers) =>
		peers.filter((peer) => !spotlights.includes(peer.id))
			.sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || '')))
);

export const raisedHandsSelector = createSelector(
	peersSelector,
	(peers) => peers.reduce((a, b) => (a + (b.raisedHand ? 1 : 0)), 0)
);

export const unreadSelector = createSelector(
	unreadMessages,
	unreadFiles,
	raisedHandsSelector,
	(messages, files, raisedHands) =>
		messages + files + raisedHands
);

export const fullscreenConsumerSelector = createSelector(
	fullscreenConsumer,
	consumersSelect,
	(consumer, consumers) =>
		consumers.find((c) => c.id === consumer)
);

export const windowedConsumerSelector = createSelector(
	windowedConsumer,
	consumersSelect,
	(consumer, consumers) =>
		consumers.find((c) => c.id === consumer)
);

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

export const peerDisplayNameSelector = createSelector(
	peerSelector,
	(peer) => peer?.displayName
);

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const makePeerConsumerSelector = (id: string) => {
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