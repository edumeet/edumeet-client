import { permissionsActions } from '../slices/permissionsSlice';
import { AppThunk } from '../store';
import { roomActions } from '../slices/roomSlice';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { getTenantFromFqdn } from './managementActions';
import { Logger } from '../../utils/Logger';
import { notificationsActions } from '../slices/notificationsSlice';
import { managamentActions } from '../slices/managementSlice';
import { jwtDecode } from 'jwt-decode';

const logger = new Logger('LoginActions');

type JwtPayload = {
	exp?: number;
	iat?: number;
};

let refreshTimeout: number | undefined;

const clearTokenRefreshTimeout = (): void => {
	if (refreshTimeout) {
		window.clearTimeout(refreshTimeout);
		refreshTimeout = undefined;
	}
};

const computeRefreshDelayMs = (token: string, fraction = 0.8): number | undefined => {
	const payload = jwtDecode<JwtPayload>(token);
	const exp = payload.exp;
	const iat = payload.iat;


	if (typeof exp !== 'number' || typeof iat !== 'number') {
		return undefined;
	}

	const expMs = exp * 1000;
	const iatMs = iat * 1000;
	const lifetimeMs = expMs - iatMs;

	if (lifetimeMs <= 0) {
		return undefined;
	}

	const refreshAtMs = iatMs + lifetimeMs * fraction;
	const delayMs = refreshAtMs - Date.now();

	if (delayMs <= 0) {
		return 0;
	}

	return delayMs;
};

export const stopTokenRefresh = (): AppThunk<void> => () => {
	clearTokenRefreshTimeout();
};

export const startTokenRefresh = (token?: string): AppThunk<void> => (
	dispatch,
	getState,
	{ signalingService, managementService }
): void => {
	clearTokenRefreshTimeout();

	if (!token) return;

	const delayMs = computeRefreshDelayMs(token, 0.8);

	if (delayMs === undefined) return;

	refreshTimeout = window.setTimeout(async () => {
		try {
			const current = getState().permissions.token;

			if (!current || current !== token) return;

			logger.debug('startTokenRefresh - trying to refresh [old token: %s]', token);

			const authResult = await (await managementService).reAuthenticate();
			const newToken = authResult?.accessToken;

			if (!newToken || typeof newToken !== 'string') return;

			logger.debug('startTokenRefresh - got new token [new token: %s]', newToken);

			dispatch(permissionsActions.setToken(newToken));

			if (getState().signaling.state === 'connected') {
				await signalingService.sendRequest('updateToken', { token: newToken });
			}

			dispatch(startTokenRefresh(newToken));
		} catch (error) {
			clearTokenRefreshTimeout();

			logger.warn('startTokenRefresh - failed to refresh token [error: %s]', error);
		}
	}, delayMs);
};

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

	}
	window.open(`${config.managementUrl}/oauth/tenant?tenantId=${tenantId}`, 'loginWindow');
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
			dispatch(startTokenRefresh(token));
			dispatch(permissionsActions.setLoggedIn(true));
		} else {
			dispatch(stopTokenRefresh());
			dispatch(permissionsActions.setToken());
			dispatch(permissionsActions.setLoggedIn(false));
		}
	} catch (error) {
		logger.error('AdminLogin [error:%o]', error);

		token = undefined;

		dispatch(stopTokenRefresh());
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
		try {
			const authResult = await (await managementService).authenticate({ accessToken, strategy: 'jwt' });

			loggedIn = true;
			token = authResult?.accessToken || accessToken;

			dispatch(permissionsActions.setToken(token));
			dispatch(startTokenRefresh(token));
		} catch (error) {
			await (await managementService).authentication.removeAccessToken();

			loggedIn = false;
			token = undefined;

			dispatch(stopTokenRefresh());
			dispatch(permissionsActions.setToken());
		}
	} else {
		token = undefined;
	}

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

	dispatch(stopTokenRefresh());
	dispatch(permissionsActions.setToken());
	dispatch(permissionsActions.setLoggedIn(false));

	dispatch(managamentActions.clearUser());

	if (getState().signaling.state === 'connected')
		await signalingService.sendRequest('updateToken').catch((e) => logger.error('updateToken request failed [error: %o]', e));

	if (tenantId) {
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
