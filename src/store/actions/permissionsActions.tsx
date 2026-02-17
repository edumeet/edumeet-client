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
let lastRefreshAt = 0;

const clearTokenRefreshTimeout = (): void => {
	logger.debug('clearTokenRefreshTimeout');

	if (refreshTimeout) {
		window.clearTimeout(refreshTimeout);
		refreshTimeout = undefined;
	}
};

const computeRefreshDelayMs = (
	token: string,
	fraction = 0.8,
	minDelayMs = 10_000,
	expiryBufferMs = 15_000
): number | undefined => {
	const payload = jwtDecode<JwtPayload>(token);

	const exp = payload.exp;
	const iat = payload.iat;

	if (typeof exp !== 'number') {
		return undefined;
	}

	const now = Math.floor(Date.now() / 1000);

	if (exp <= now) {
		return undefined;
	}

	const expMs = exp * 1000;

	if (typeof iat === 'number') {
		const iatMs = iat * 1000;
		const lifetimeMs = expMs - iatMs;

		if (lifetimeMs > 0) {
			const refreshAtMs = iatMs + (lifetimeMs * fraction);
			const delayMs = refreshAtMs - Date.now();

			if (delayMs < minDelayMs) {
				return minDelayMs;
			}

			return delayMs;
		}
	}

	const delayMs = (expMs - expiryBufferMs) - Date.now();

	if (delayMs < minDelayMs) {
		return minDelayMs;
	}

	return delayMs;
};

const isTokenExpired = (token: string, skewSeconds = 5): boolean => {
	const payload = jwtDecode<JwtPayload>(token);
	const exp = payload.exp;

	if (typeof exp !== 'number') {
		return true;
	}

	const now = Math.floor(Date.now() / 1000);

	return exp <= (now + skewSeconds);
};

export const stopTokenRefresh = (): AppThunk<void> => () => {
	logger.debug('stopTokenRefresh');

	clearTokenRefreshTimeout();
};

export const startTokenRefresh = (token?: string): AppThunk<void> => (
	dispatch,
	getState,
	{ signalingService, managementService }
): void => {
	logger.debug('startTokenRefresh');

	clearTokenRefreshTimeout();

	if (!token) return;

	const delayMs = computeRefreshDelayMs(token, 0.8);

	if (delayMs === undefined) return;

	logger.debug('startTokenRefresh - setTimeout [delayMs = %s]', delayMs);

	refreshTimeout = window.setTimeout(async () => {
		try {
			const current = getState().permissions.token;

			if (!current || current !== token) return;

			if (isTokenExpired(token)) {
				logger.warn('startTokenRefresh - token already expired, stopping refresh and logging out');

				clearTokenRefreshTimeout();

				dispatch(permissionsActions.setLoggedIn(false));
				dispatch(permissionsActions.setToken());

				return;
			}

			const now = Date.now();

			if (now - lastRefreshAt < 5_000) {
				dispatch(startTokenRefresh(token));

				return;
			}

			lastRefreshAt = now;

			logger.debug('startTokenRefresh - trying to refresh');

			const authResult = await (await managementService).reAuthenticate({ strategy: 'jwt', refresh: true });
			const newToken = authResult?.accessToken;

			if (!newToken || typeof newToken !== 'string') return;

			logger.debug('startTokenRefresh - got new token');

			const payload = jwtDecode<JwtPayload>(newToken);

			logger.debug(
				'startTokenRefresh - new token times [iat: %s exp: %s now: %s]',
				payload.iat,
				payload.exp,
				Math.floor(Date.now() / 1000)
			);

			if (newToken !== token) {
				logger.debug('startTokenRefresh - setting new token');

				dispatch(permissionsActions.setToken(newToken));

				if (getState().signaling.state === 'connected') {
					await signalingService.sendRequest('updateToken', { token: newToken });
				}

				dispatch(startTokenRefresh(newToken));
			} else {
				logger.warn('startTokenRefresh - new token equals old token');

				dispatch(startTokenRefresh(token));
			}
		} catch (error) {
			clearTokenRefreshTimeout();

			logger.warn('startTokenRefresh - failed to refresh token [error: %o]', error);
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
			logger.error('checkJWT authenticate failed [error: %o]', error);

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
