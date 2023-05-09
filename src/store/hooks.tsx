import { SnackbarKey, useSnackbar } from 'notistack';
import {
	useCallback,
	ContextType,
	useContext,
	useEffect,
	useMemo,
	useRef
} from 'react';
import { Blocker, History, Transition } from 'history';
import {
	Navigator as BaseNavigator,
	UNSAFE_NavigationContext as NavigationContext
} from 'react-router-dom';
import {
	TypedUseSelectorHook,
	useDispatch,
	useSelector
} from 'react-redux';
import { MediaDevice } from '../services/deviceService';
import { Permission } from '../utils/roles';
import {
	makeDevicesSelector,
	makePeerConsumerSelector,
	makePeerProducerSelector,
	makePeerSelector,
	makePeerTranscriptsSelector,
	makePermissionSelector,
	PeerConsumers,
	PeerProducers
} from './selectors';
import { notificationsActions } from './slices/notificationsSlice';
import { Peer } from './slices/peersSlice';
import type { RootState, AppDispatch } from './store';
import { LeavePromptContext } from './store';
import { Transcript } from '../services/mediaService';

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
 * Hook to access the comsumers of a peer.
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
 * Hook to access the producers of a peer.
 * 
 * @param peerId - The id of the peer.
 * @returns {PeerConsumers} The producers of the peer.
 */
export const usePeerProducers = (peerId: string): PeerProducers => {
	const getPeerProducers =
		useMemo(() => makePeerProducerSelector(peerId), []);

	return useAppSelector(getPeerProducers);
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
export const useDeviceSelector = (kind: MediaDeviceKind): MediaDevice[] => {
	const devicesSelector = useMemo(() => makeDevicesSelector(kind), [ kind ]);

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

interface Navigator extends BaseNavigator {
	block: History['block'];
}

type NavigationContextWithBlock = ContextType<typeof NavigationContext> & {
	navigator: Navigator;
};

export const useBlocker = (blocker: Blocker, when = true): void => {
	const { navigator } = useContext(
		NavigationContext
	) as NavigationContextWithBlock;

	useEffect(() => {
		if (!when)
			return;

		const unblock = navigator.block((tx: Transition) => {
			const autoUnblockingTx = {
				...tx,
				retry() {
					unblock();
					tx.retry();
				}
			};

			blocker(autoUnblockingTx);
		});

		return unblock;
	}, [ navigator, blocker, when ]);
};

/**
 * Hook to show a leave prompt when the user tries to leave the page.
 * 
 * @param when - Whether to show the leave prompt or not.
 * @returns {void}
 */
export const usePrompt = (when = true): void => {
	const showPrompt = useContext(LeavePromptContext);

	const blocker = useCallback(
		async (tx: Transition) => {
			try {
				await showPrompt();
				tx.retry();
			} catch (e) {
				// Do nothing
			}
		},
		[ showPrompt ]
	);

	return useBlocker(blocker, when);
};

type ResultBox<T> = { v: T }

export function useConstant<T>(fn: () => T): T {
	const ref = useRef<ResultBox<T>>();

	if (!ref.current)
		ref.current = { v: fn() };

	return ref.current.v;
}