import { createSelector } from 'reselect';
import { Permission, Role } from '../utils/roles';
import { StateConsumer } from './slices/consumersSlice';
import { LobbyPeer } from './slices/lobbySlice';
import { Peer } from './slices/peersSlice';
import { StateProducer } from './slices/producersSlice';
import { RootState } from './store';

// eslint-disable-next-line no-unused-vars
type Selector<S> = (state: RootState) => S;

const meRolesSelect: Selector<Set<number>> =
	(state) => state.permissions.roles;
const userRolesSelect: Selector<Map<number, Role> | undefined> =
	(state) => state.permissions.userRoles;
const roomPermissionsSelect: Selector<Record<Permission, Role[]> | undefined> =
	(state) => state.permissions.roomPermissions;
const roomAllowWhenRoleMissing: Selector<Permission[] | undefined> =
	(state) => state.permissions.allowWhenRoleMissing;
const getPeerConsumers = (state: RootState, id: string) =>
	(state.peers[id] ? state.peers[id].consumers : null);
const producersSelect: Selector<Record<string, StateProducer>> =
	(state) => state.producers;
const consumersSelect: Selector<Record<string, StateConsumer>> =
	(state) => state.consumers;
const spotlightsSelector: Selector<Set<string>> =
	(state) => state.room.spotlights;
const peersSelector: Selector<Record<string, Peer>> =
	(state) => state.peers;
const lobbyPeersSelector: Selector<Record<string, LobbyPeer>> =
	(state) => state.lobbyPeers;
const isHidden: Selector<boolean> = (state) => state.ui.hideSelfView;
const unreadMessages: Selector<number> = (state) => state.drawer.unreadMessages;
const unreadFiles: Selector<number> = (state) => state.drawer.unreadFiles;

const peersKeySelector = createSelector(
	peersSelector,
	(peers) => Object.keys(peers)
);

export const peersValueSelector = createSelector(
	peersSelector,
	(peers) => Object.values(peers)
);

export const lobbyPeersKeySelector = createSelector(
	lobbyPeersSelector,
	(lobbyPeers) => Object.keys(lobbyPeers)
);

const producersValuesSelector = createSelector(
	producersSelect,
	(producers) => Object.values(producers)
);

export const micProducersSelector = createSelector(
	producersValuesSelector,
	(producers) => producers.filter((producer) => producer.source === 'mic')
);

export const webcamProducersSelector = createSelector(
	producersValuesSelector,
	(producers) => producers.filter((producer) => producer.source === 'webcam')
);

export const screenProducersSelector = createSelector(
	producersValuesSelector,
	(producers) => producers.filter((producer) => producer.source === 'screen')
);

export const extraVideoProducersSelector = createSelector(
	producersValuesSelector,
	(producers) => producers.filter((producer) => producer.source === 'extravideo')
);

export const micProducerSelector = createSelector(
	producersValuesSelector,
	(producers) => producers.find((producer) => producer.source === 'mic')
);

export const webcamProducerSelector = createSelector(
	producersValuesSelector,
	(producers) => producers.find((producer) => producer.source === 'webcam')
);

export const screenProducerSelector = createSelector(
	producersValuesSelector,
	(producers) => producers.find((producer) => producer.source === 'screen')
);

const consumersValuesSelector = createSelector(
	consumersSelect,
	(consumers) => Object.values(consumers)
);

export const micConsumerSelector = createSelector(
	consumersValuesSelector,
	(consumers) => consumers.filter((consumer) => consumer.source === 'mic')
);

export const webcamConsumerSelector = createSelector(
	consumersValuesSelector,
	(consumers) => consumers.filter((consumer) => consumer.source === 'webcam')
);

export const screenConsumerSelector = createSelector(
	consumersValuesSelector,
	(consumers) => consumers.filter((consumer) => consumer.source === 'screen')
);

export const spotlightScreenConsumerSelector = createSelector(
	spotlightsSelector,
	consumersValuesSelector,
	(spotlights, consumers) =>
		consumers.filter(
			(consumer) => consumer.source === 'screen' && spotlights.has(consumer.peerId)
		)
);

export const spotlightExtraVideoConsumerSelector = createSelector(
	spotlightsSelector,
	consumersValuesSelector,
	(spotlights, consumers) =>
		consumers.filter(
			(consumer) => consumer.source === 'extravideo' && spotlights.has(consumer.peerId)
		)
);

export const passiveMicConsumerSelector = createSelector(
	spotlightsSelector,
	consumersValuesSelector,
	(spotlights, consumers) =>
		consumers.filter(
			(consumer) => consumer.source === 'mic' && !spotlights.has(consumer.peerId)
		)
);

export const highestRoleLevelSelector = createSelector(
	meRolesSelect,
	userRolesSelect,
	(roles, userRoles) => {
		let level = 0;

		for (const role of roles) {
			const tmpLevel = userRoles?.get(role)?.level;

			if (tmpLevel && tmpLevel > level)
				level = tmpLevel;
		}

		return level;
	}
);

export const spotlightsLengthSelector = createSelector(
	spotlightsSelector,
	(spotlights) => spotlights.size
);

export const spotlightPeersSelector = createSelector(
	spotlightsSelector,
	peersKeySelector,
	(spotlights, peers) =>
		peers.filter((peerId) => spotlights.has(peerId))
);

export const spotlightSortedPeersSelector = createSelector(
	spotlightsSelector,
	peersValueSelector,
	(spotlights, peers) =>
		peers.filter((peer) => spotlights.has(peer.id) && !peer.raisedHand)
			.sort((a, b) => String(a.displayName || '')
				.localeCompare(String(b.displayName || ''))
			)
);

export const participantListSelector = createSelector(
	[ spotlightsSelector, peersValueSelector ],
	(spotlights, peers) => {
		const raisedHandSortedPeers =
			peers.filter((peer) => peer.raisedHand)
				.sort((a, b) => 
					(a.raisedHandTimestamp?.getTime() || 0) -
					(b.raisedHandTimestamp?.getTime() || 0)
				);
		const spotlightSortedPeers =
			peers.filter((peer) => spotlights.has(peer.id) && !peer.raisedHand)
				.sort((a, b) => String(a.displayName || '')
					.localeCompare(String(b.displayName || ''))
				);
		const peersSorted =
			peers.filter((peer) => !spotlights.has(peer.id) && !peer.raisedHand)
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
	peersValueSelector,
	(peers) => peers.length
);

export const lobbyPeersLengthSelector = createSelector(
	lobbyPeersKeySelector,
	(peers) => peers.length
);

export const passivePeersSelector = createSelector(
	spotlightsSelector,
	peersValueSelector,
	(spotlights, peers) =>
		peers.filter((peer) => !spotlights.has(peer.id))
			.sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || '')))
);

export const raisedHandsSelector = createSelector(
	peersValueSelector,
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
	isHidden,
	spotlightsLengthSelector,
	screenProducersSelector,
	spotlightScreenConsumerSelector,
	extraVideoProducersSelector,
	spotlightExtraVideoConsumerSelector,
	(
		hidden,
		spotlightsLength,
		screenProducers,
		screenConsumers,
		extraVideoProducers,
		extraVideoConsumers
	) =>
		spotlightsLength + (hidden ? 0 : 1) +
			(hidden ? 0 : screenProducers.length) + screenConsumers.length +
			(hidden ? 0 : extraVideoProducers.length) + extraVideoConsumers.length
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

export const makePeerConsumerSelector = () => {
	return createSelector(
		getPeerConsumers,
		consumersSelect,
		(consumers: Set<string>, allConsumers: Record<string, StateConsumer>) => {
			if (!consumers)
				return null;

			const consumersArray = [ ...consumers ]
				.map((consumerId) => allConsumers[consumerId]);
			const micConsumer =
				consumersArray.find((consumer) => consumer.source === 'mic');
			const webcamConsumer =
				consumersArray.find((consumer) => consumer.source === 'webcam');
			const screenConsumer =
				consumersArray.find((consumer) => consumer.source === 'screen');
			const extraVideoConsumers =
				consumersArray.filter((consumer) => consumer.source === 'extravideo');

			return { micConsumer, webcamConsumer, screenConsumer, extraVideoConsumers };
		}
	);
};

export const makePermissionSelector = (permission: Permission) => {
	return createSelector(
		meRolesSelect,
		roomPermissionsSelect,
		roomAllowWhenRoleMissing,
		peersValueSelector,
		(roles, roomPermissions, allowWhenRoleMissing, peers) => {
			if (!roomPermissions)
				return false;

			const permitted = [ ...roles ].some((roleId) =>
				roomPermissions[permission].some((permissionRole: Role) =>
					roleId === permissionRole.id
				)
			);

			if (permitted)
				return true;

			if (!allowWhenRoleMissing)
				return false;

			// Allow if config is set, and no one is present
			return allowWhenRoleMissing.includes(permission) &&
				peers.filter(
					(peer) =>
						[ ...peer.roles ].some(
							(roleId) =>
								roomPermissions[permission]
									.some((permissionRole: Role) =>
										roleId === permissionRole.id
									)
						)
				).length === 0;
		}
	);
};