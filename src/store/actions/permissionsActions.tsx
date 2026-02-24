import { permissionsActions } from '../slices/permissionsSlice';
import { AppThunk } from '../store';
import { roomActions } from '../slices/roomSlice';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { getTenantFromFqdn } from './managementActions';
import { Logger } from '../../utils/Logger';
import { notificationsActions } from '../slices/notificationsSlice';
import { managamentActions } from '../slices/managementSlice';
import { jwtDecode, JwtPayload } from 'jwt-decode';

const logger = new Logger('LoginActions');

export const login = (): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ config }
): Promise<void> => {
	logger.debug('login()');

	const tenantId = await dispatch(getTenantFromFqdn(window.location.hostname));

	if (!tenantId) {
		dispatch(notificationsActions.enqueueNotification({
			message: 'no tenant found',
			options: { variant: 'error' }
		}));

		return logger.error('login() | no tenant found');

	} else {
		window.open(`${config.managementUrl}/oauth/tenant?tenantId=${tenantId}`, 'loginWindow');
	}
};

export const adminLogin = (email: string, password: string): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService, managementService }
): Promise<void> => {
	logger.debug('adminLogin() [email: %s]', email);

	let token: string | undefined;

	try {
		const auth = await (await managementService).authenticate({
			strategy: 'local',
			email: email,
			password: password
		});

		token = auth?.accessToken;

		if (token) {
			dispatch(permissionsActions.setToken(token));
			dispatch(permissionsActions.setLoggedIn(true));
		} else {
			dispatch(permissionsActions.setToken());
			dispatch(permissionsActions.setLoggedIn(false));
		}
	} catch (error) {
		logger.error('AdminLogin [error:%o]', error);

		token = undefined;

		dispatch(permissionsActions.setToken());
		dispatch(permissionsActions.setLoggedIn(false));

		dispatch(notificationsActions.enqueueNotification({
			message: 'Invalid login',
			options: { variant: 'error' }
		}));
	}

	if (getState().signaling.state === 'connected') {
		await signalingService.sendRequest('updateToken', { token })
			.catch((e) => logger.error('updateToken request failed [error: %o]', e));
	}
};

export const checkJWT = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService, managementService }
): Promise<void> => {
	logger.debug('checkJWT()');

	const accessToken = localStorage.getItem('feathers-jwt');

	let loggedIn = false;
	let token: string | undefined;

	if (accessToken) {
		const management = await managementService;

		let expired = true;

		try {
			const { exp } = jwtDecode<JwtPayload>(accessToken);
			expired = !exp || exp <= Math.floor(Date.now() / 1000);
		} catch (error) {
			logger.warn('checkJWT() - Invalid JWT format, treating as expired', error);
		}

		if (expired) {
			logger.debug('checkJWT() - JWT expired');

			token = undefined;
			loggedIn = false;

			await management.authentication.removeAccessToken();
		} else {
			try {
				logger.debug('checkJWT() - JWT valid, running authenticate strategy: jwt');

				// feathers does not issue a new token on authenticate, so we do not need to store it
				await management.authenticate({ accessToken, strategy: 'jwt' });

				token = accessToken;
				loggedIn = true;

			} catch (error) {
				logger.error('checkJWT() - authenticate failed [error: %o]', error);

				token = undefined;
				loggedIn = false;

				await management.authentication.removeAccessToken();
			}
		}
	} else {
		token = undefined;
		loggedIn = false;
	}

	dispatch(permissionsActions.setToken(token));
	dispatch(permissionsActions.setLoggedIn(loggedIn));

	if (getState().signaling.state === 'connected') {
		await signalingService.sendRequest('updateToken', { token })
			.catch((e) => logger.error('updateToken request failed [error: %o]', e));
	}
};

export const logout = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService, managementService, config }
): Promise<void> => {
	logger.debug('logout()');

	const tenantId = await dispatch(getTenantFromFqdn(window.location.hostname));

	await (await managementService).authentication.removeAccessToken();

	dispatch(permissionsActions.setToken());
	dispatch(permissionsActions.setLoggedIn(false));

	dispatch(managamentActions.clearUser());

	if (getState().signaling.state === 'connected') {
		await signalingService.sendRequest('updateToken').catch((e) => logger.error('updateToken request failed [error: %o]', e));
	}

	if (!tenantId) {
		dispatch(notificationsActions.enqueueNotification({
			message: 'no tenant found',
			options: { variant: 'error' }
		}));

		return logger.error('logout() | no tenant found');

	} else {
		window.open(`${config.managementUrl}/auth/logout?tenantId=${tenantId}`, 'logoutWindow');
	}
};

export const lock = (): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('lock()');

	dispatch(roomActions.updateRoom({ lockInProgress: true }));

	try {
		await signalingService.sendRequest('lockRoom');

		dispatch(permissionsActions.setLocked(true));
	} catch (error) {
		logger.error('lock() [error:"%o"]', error);
	} finally {
		dispatch(roomActions.updateRoom({ lockInProgress: false }));
	}
};

export const unlock = (): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('unlock()');

	dispatch(roomActions.updateRoom({ lockInProgress: true }));

	try {
		await signalingService.sendRequest('unlockRoom');

		dispatch(permissionsActions.setLocked(false));
	} catch (error) {
		logger.error('unlock() [error:"%o"]', error);
	} finally {
		dispatch(roomActions.updateRoom({ lockInProgress: false }));
	}
};

export const promotePeer = (peerId: string): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
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

export const promotePeers = (): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
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
