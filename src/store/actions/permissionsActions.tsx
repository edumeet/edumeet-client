import { permissionsActions } from '../slices/permissionsSlice';
import { AppThunk } from '../store';
import { roomActions } from '../slices/roomSlice';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { getTenantFromFqdn } from './managementActions';
import { Logger } from '../../utils/Logger';
import { notificationsActions } from '../slices/notificationsSlice';
import { managamentActions } from '../slices/managementSlice';
import { signalingActions } from '../slices/signalingSlice';
import { jwtDecode, JwtPayload } from 'jwt-decode';

const logger = new Logger('PermissionsActions');

// Holds the pending token-refresh timer so it can be cancelled on logout.
let tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // refresh 5 min before expiry

const scheduleTokenRefresh = (token: string): AppThunk<void> => (
	dispatch
) => {
	if (tokenRefreshTimer !== null) {
		clearTimeout(tokenRefreshTimer);
		tokenRefreshTimer = null;
	}

	try {
		const { exp } = jwtDecode<JwtPayload>(token);

		if (!exp) return;

		const msUntilExpiry = (exp * 1000) - Date.now();

		if (msUntilExpiry <= 0) return; // already expired, nothing to do

		const msUntilRefresh = msUntilExpiry - REFRESH_BEFORE_EXPIRY_MS;

		if (msUntilRefresh <= 0) {
			// Token is valid but inside the refresh window — refresh immediately.
			logger.debug('scheduleTokenRefresh() - inside refresh window, refreshing immediately');
			dispatch(refreshToken());

			return;
		}

		logger.debug(
			'scheduleTokenRefresh() - will refresh in %d min',
			Math.round(msUntilRefresh / 60000)
		);

		tokenRefreshTimer = setTimeout(() => {
			dispatch(refreshToken());
		}, msUntilRefresh);
	} catch (error) {
		logger.warn('scheduleTokenRefresh() - could not decode token [error: %o]', error);
	}
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

	} else {
		window.open(`${config.managementUrl}/oauth/tenant?tenantId=${tenantId}`, 'loginWindow');
	}
};

export const adminLogin = (email: string, password: string): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ managementService }
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
		dispatch(updateLoginState(token));
	} catch (error) {
		logger.error('AdminLogin [error:%o]', error);

		dispatch(updateLoginState());

		dispatch(notificationsActions.enqueueNotification({
			message: 'Invalid login',
			options: { variant: 'error' }
		}));
	}
};

export const checkJWT = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ managementService }
): Promise<void> => {
	logger.debug('checkJWT()');

	const accessToken = localStorage.getItem('feathers-jwt');

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

			await management.authentication.removeAccessToken();
		} else {
			try {
				logger.debug('checkJWT() - JWT valid, running authenticate strategy: jwt');

				// feathers does not issue a new token on authenticate, so we do not need to store it
				await management.authenticate({ accessToken, strategy: 'jwt' });

				token = accessToken;

			} catch (error) {
				logger.error('checkJWT() - authenticate failed [error: %o]', error);

				token = undefined;

				await management.authentication.removeAccessToken();
			}
		}
	} else {
		token = undefined;
	}

	dispatch(updateLoginState(token));
};

export const logout = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ managementService, config }
): Promise<void> => {
	logger.debug('logout()');

	const tenantId = await dispatch(getTenantFromFqdn(window.location.hostname));

	await (await managementService).authentication.removeAccessToken();

	dispatch(updateLoginState());

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

export const refreshToken = (): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<void> => {
	logger.debug('refreshToken()');

	try {
		const management = await managementService;
		const result = await management.service('token-refresh').create({});
		const newToken: string = result.accessToken;

		await management.authentication.setAccessToken(newToken);
		dispatch(updateLoginState(newToken));

		const { exp } = jwtDecode<JwtPayload>(newToken);

		logger.debug(
			'refreshToken() - token refreshed successfully, new expiry: %s',
			exp ? new Date(exp * 1000).toISOString() : 'unknown'
		);
	} catch (error) {
		logger.error('refreshToken() - failed [error: %o]', error);
		// Do not force a logout here; let the existing token expire naturally.
		// If the token is already expired the next API call will trigger handleAuthError.
	}
};

export const updateLoginState = (inputToken?: string): AppThunk<void> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('updateLoginState()');

	const token = inputToken && inputToken.length > 0 ? inputToken : undefined;
	const currentUrl = getState().signaling.url;

	let nextUrl: string | undefined = currentUrl;

	try {
		if (currentUrl) {
			const currentUrlObject = new URL(currentUrl);

			if (token) {
				currentUrlObject.searchParams.set('token', token);
			} else {
				currentUrlObject.searchParams.delete('token');
			}

			nextUrl = currentUrlObject.toString();
		}
	} catch (error) {
		logger.warn('updateLoginState() failed to parse URL [error: %o]', error);
	}

	if (token) {
		logger.debug('updateLoginState() setting token and loggedIn=true');
		dispatch(permissionsActions.setToken(token));
		dispatch(permissionsActions.setLoggedIn(true));
		dispatch(scheduleTokenRefresh(token));
	} else {
		logger.debug('updateLoginState() removing token and loggedIn=false');
		dispatch(permissionsActions.setToken());
		dispatch(permissionsActions.setLoggedIn(false));
		dispatch(managamentActions.clearUser());

		if (tokenRefreshTimer !== null) {
			clearTimeout(tokenRefreshTimer);
			tokenRefreshTimer = null;
		}
	}

	if (nextUrl && nextUrl !== currentUrl) {
		dispatch(signalingActions.setUrl(nextUrl));
		logger.debug('updateLoginState() updated signaling URL [old: %s], [new: %s]', currentUrl, nextUrl);
	} else {
		logger.debug('updateLoginState() signaling URL stays the same');
	}

	if (getState().signaling.state === 'connected') {
		await signalingService.sendRequest('updateToken', { token })
			.catch((error) => logger.error('updateToken request failed [error: %o]', error));
	}
};