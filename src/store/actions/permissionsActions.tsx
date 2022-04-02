import { Logger } from '../../utils/logger';
import { permissionsActions } from '../slices/permissionsSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';

const logger = new Logger('LoginActions');

export const login = () => (
	_dispatch: AppDispatch,
	getState: RootState
): void => {
	logger.debug('login()');

	const { id: peerId } = getState().me;
	const { name: roomId } = getState().room;

	logger.debug('Login!');
	window.open(`/auth/login?peerId=${peerId}&roomId=${roomId}`, 'loginWindow');
};

export const logout = () => (
	_dispatch: AppDispatch,
	getState: RootState
): void => {
	logger.debug('logout()');

	const { id: peerId } = getState().me;
	const { name: roomId } = getState().room;

	logger.debug('Logout!');
	window.open(`/auth/logout?peerId=${peerId}&roomId=${roomId}`, 'logoutWindow');
};

export const lock = () => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('lock()');

	try {
		await signalingService.sendRequest('lockRoom');

		dispatch(permissionsActions.setLocked(true));
	} catch (error) {
		logger.error('lock() [error:"%o"]', error);
	}
};

export const unlock = () => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('unlock()');

	try {
		await signalingService.sendRequest('unlockRoom');

		dispatch(permissionsActions.setLocked(false));
	} catch (error) {
		logger.error('unlock() [error:"%o"]', error);
	}
};