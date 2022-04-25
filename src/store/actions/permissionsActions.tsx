import { Logger } from '../../utils/logger';
import { permissionsActions } from '../slices/permissionsSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { roomActions } from '../slices/roomSlice';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';

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

export const promotePeer = (peerId: string) => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('promotePeer() [peerId:"%s"]', peerId);

	dispatch(lobbyPeersActions.updatePeer({ id: peerId, promotionInProgress: true }));

	try {
		await signalingService.sendRequest('promotePeer', { peerId });
	} catch (error) {
		logger.error('promotePeer() [error:"%o"]', error);
	} finally {
		dispatch(lobbyPeersActions.updatePeer({ id: peerId, promotionInProgress: false }));
	}
};

export const promotePeers = () => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('promotePeers()');

	dispatch(
		roomActions.updateRoom({ lobbyPeersPromotionInProgress: true })
	);

	try {
		await signalingService.sendRequest('promoteAllPeers');
	} catch (error) {
		logger.error('promotePeers() [error:"%o"]', error);
	} finally {
		dispatch(
			roomActions.updateRoom({ lobbyPeersPromotionInProgress: false })
		);
	}
};