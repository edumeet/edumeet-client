import { SnackbarKey, useSnackbar } from 'notistack';
import { useEffect, useMemo, useRef } from 'react';
import { unstable_useBlocker as useBlocker } from 'react-router-dom';
import {
	TypedUseSelectorHook,
	useDispatch,
	useSelector
} from 'react-redux';
import { MediaDevice } from '../services/deviceService';
import { Permission } from '../utils/roles';
import {
	makeDevicesSelector,
	makeIsActiveSpeakerSelector,
	makePeerConsumerSelector,
	makePeerSelector,
	makePeersInSessionSelector,
	makePeerTranscriptsSelector,
	makePermissionSelector,
	PeerConsumers
} from './selectors';
import { notificationsActions } from './slices/notificationsSlice';
import { Peer } from './slices/peersSlice';
import { RootState, AppDispatch } from './store';
import { Transcript } from '../services/mediaService';
import { leaveRoom } from './actions/roomActions';

/**
 * Hook to access the redux dispatch function.
 * 
 * @returns {AppDispatch} The redux dispatch function.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Hook to access the redux state.
 * 
 * @returns {TypedUseSelectorHook<RootState>} The redux state.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Hook to access the consumers of a peer.
 * 
 * @param peerId - The id of the peer.
 * @returns {PeerConsumers} The consumers of the peer.
 */
export const usePeerConsumers = (peerId: string): PeerConsumers => {
	const getPeerConsumers =
		useMemo(() => makePeerConsumerSelector(peerId), []);

	return useAppSelector(getPeerConsumers);
};

/**
 * Hook to access peer transcription.
 */
export const usePeerTranscripts = (peerId: string): Transcript[] => {
	const getPeerTranscripts =
		useMemo(() => makePeerTranscriptsSelector(peerId), []);

	return useAppSelector(getPeerTranscripts);
};

/**
 * Hook to get the peer with the given id.
 * 
 * @param peerId - The id of the peer.
 * @returns {Peer | undefined} The peer with the given id.
 */
export const usePeer = (peerId: string): Peer | undefined => {
	const getPeer = useMemo(() => makePeerSelector(peerId), []);

	return useAppSelector(getPeer);
};

/** Hook to get peers in a session.
 * 
 * @param sessionId - The id of the session.
 * @returns {Peer[]} The peers in the session.
 */
export const usePeersInSession = (sessionId: string): Peer[] => {
	const getPeersInSession = useMemo(() => makePeersInSessionSelector(sessionId), []);

	return useAppSelector(getPeersInSession);
};

/**
 * Hook to check if the user has the given permission.
 * 
 * @param permission - The permission to check.
 * @returns {boolean} True if the user has the given permission.
 */
export const usePermissionSelector = (permission: Permission): boolean => {
	const permissionSelector =
		useMemo(() => makePermissionSelector(permission), []);

	return useAppSelector(permissionSelector);
};

/**
 * Hook to get the list of media devices filtered by the given kind.
 * 
 * @param kind - The kind of the devices to get.
 * @returns {MediaDevice[]} The list of media devices.
 */
export const useDeviceSelector = (kind: MediaDeviceKind, exludedDeviceId?: string): MediaDevice[] => {
	const devicesSelector = useMemo(() => makeDevicesSelector(kind, exludedDeviceId), [ kind ]);

	return useAppSelector(devicesSelector);
};

let displayed: SnackbarKey[] = [];

/**
 * Hook to add notifications to a component.
 * 
 * @returns {void}
 */
export const useNotifier = (): void => {
	const dispatch = useAppDispatch();
	const notifications = useAppSelector((store) => store.notifications);
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	const storeDisplayed = (id: SnackbarKey) => {
		displayed = [ ...displayed, id ];
	};

	const removeDisplayed = (id: SnackbarKey) => {
		displayed = [ ...displayed.filter((key) => id !== key) ];
	};

	useEffect(() => {
		notifications.forEach(({ key, message, options = {} }) => {
			if (displayed.includes(key)) return;

			enqueueSnackbar(message, {
				key,
				...options,
				onExited: (_event, myKey) => {
					dispatch(notificationsActions.removeNotification(myKey));
					removeDisplayed(myKey);
				},
			});

			storeDisplayed(key);
		});
	}, [ notifications, closeSnackbar, enqueueSnackbar, dispatch ]);
};

/**
 * Hook to learn if id is active speaker or not.
 * 
 * @param id - id to evaluate.
 * @returns {boolean} true if id is active speaker.
 */
export const useIsActiveSpeaker = (id: string): boolean => {
	const isActiveSpeaker = useMemo(() => makeIsActiveSpeakerSelector(id), []);

	return useAppSelector(isActiveSpeaker);
};

type ResultBox<T> = { v: T }

export function useConstant<T>(fn: () => T): T {
	const ref = useRef<ResultBox<T>>();

	if (!ref.current)
		ref.current = { v: fn() };

	return ref.current.v;
}