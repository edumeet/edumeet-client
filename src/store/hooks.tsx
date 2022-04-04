import { useMemo } from 'react';
import {
	TypedUseSelectorHook,
	useDispatch,
	useSelector
} from 'react-redux';
import { MediaDevice } from '../services/mediaService';
import { Permission } from '../utils/roles';
import {
	makeDevicesSelector,
	makePeerConsumerSelector,
	makePermissionSelector,
	PeerConsumers
} from './selectors';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const usePeerConsumers = (peerId: string): PeerConsumers => {
	const getPeerConsumers =
		useMemo(() => makePeerConsumerSelector(peerId), []);

	return useAppSelector(getPeerConsumers);
};

export const usePermissionSelector = (permisssion: Permission): boolean => {
	const permissionSelector =
		useMemo(() => makePermissionSelector(permisssion), []);

	return useAppSelector(permissionSelector);
};

export const useDeviceSelector = (kind: MediaDeviceKind): MediaDevice[] => {
	const devicesSelector = useMemo(() => makeDevicesSelector(kind), [ kind ]);

	return useAppSelector(devicesSelector);
};