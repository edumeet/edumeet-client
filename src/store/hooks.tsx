import { SnackbarKey, useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
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