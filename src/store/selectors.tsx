import { createSelector } from 'reselect';
import { Permission, Role } from '../utils/roles';
import { StateConsumer } from './slices/consumersSlice';
import { LobbyPeer } from './slices/lobbyPeersSlice';
import { Peer } from './slices/peersSlice';
import { StateProducer } from './slices/producersSlice';
import { RootState } from './store';

// eslint-disable-next-line no-unused-vars
type Selector<S> = (state: RootState) => S;

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
const peersSelector: Selector<Peer[]> =
	(state) => state.peers;
const lobbyPeersSelector: Selector<Record<string, LobbyPeer>> =
	(state) => state.lobbyPeers;
const unreadMessages: Selector<number> = (state) => state.drawer.unreadMessages;
const unreadFiles: Selector<number> = (state) => state.drawer.unreadFiles;

const peerIdsSelector = createSelector(
	peersSelector,
	(peers) => peers.map((peer) => peer.id),
);

export const lobbyPeersKeySelector = createSelector(
	lobbyPeersSelector,
	(lobbyPeers) => Object.keys(lobbyPeers)
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

export const spotlightScreenConsumerSelector = createSelector(
	spotlightsSelector,
	consumersSelect,
	(spotlights, consumers) =>
		consumers.filter(
			(consumer) => consumer.source === 'screen' && spotlights.includes(consumer.peerId)
		)
);

export const spotlightExtraVideoConsumerSelector = createSelector(
	spotlightsSelector,
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

export const spotlightPeersSelector = createSelector(
	spotlightsSelector,
	peerIdsSelector,
	(spotlights, peers) =>
		peers.filter((peerId) => spotlights.includes(peerId))
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

export const peersLengthSelector = createSelector(
	peersSelector,
	(peers) => peers.length
);

export const lobbyPeersLengthSelector = createSelector(
	lobbyPeersKeySelector,
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

export const videoBoxesSelector = createSelector(
	spotlightsLengthSelector,
	screenProducerSelector,
	spotlightScreenConsumerSelector,
	extraVideoProducersSelector,
	spotlightExtraVideoConsumerSelector,
	(
		spotlightsLength,
		screenProducer,
		screenConsumers,
		extraVideoProducers,
		extraVideoConsumers
	) =>
		1 + spotlightsLength +
			(screenProducer ? 1 : 0) + screenConsumers.length +
			(extraVideoProducers.length) + extraVideoConsumers.length
);

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