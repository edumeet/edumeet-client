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
	makePeerSelector,
	makePermissionSelector,
	PeerConsumers
} from './selectors';
import { Notification, notificationsActions } from './slices/notificationsSlice';
import { Peer } from './slices/peersSlice';
import type { RootState, AppDispatch } from './store';
import { LeavePromptContext } from './store';

export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const usePeerConsumers = (peerId: string): PeerConsumers => {
	const getPeerConsumers =
		useMemo(() => makePeerConsumerSelector(peerId), []);

	return useAppSelector(getPeerConsumers);
};

export const usePeer = (peerId: string): Peer | undefined => {
	const getPeer = useMemo(() => makePeerSelector(peerId), []);

	return useAppSelector(getPeer);
};

export const usePermissionSelector = (permission: Permission): boolean => {
	const permissionSelector =
		useMemo(() => makePermissionSelector(permission), []);

	return useAppSelector(permissionSelector);
};

export const useDeviceSelector = (kind: MediaDeviceKind): MediaDevice[] => {
	const devicesSelector = useMemo(() => makeDevicesSelector(kind), [ kind ]);

	return useAppSelector(devicesSelector);
};

let displayed: SnackbarKey[] = [];

export const useNotifier = (): void => {
	const dispatch = useAppDispatch();
	const notifications = useAppSelector<Notification[]>((store) => store.notifications);
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
		if (!when) {
			return;
		}

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