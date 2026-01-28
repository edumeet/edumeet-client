import { permissionsActions } from '../slices/permissionsSlice';
import { AppThunk } from '../store';
import { roomActions } from '../slices/roomSlice';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { getTenantFromFqdn } from './managementActions';
import { syncSignalingUrl } from './signalingUrlActions';
import { Logger } from '../../utils/Logger';
import { notificationsActions } from '../slices/notificationsSlice';
import { managamentActions } from '../slices/managementSlice';
import { jwtDecode, JwtPayload } from 'jwt-decode';

const logger = new Logger('LoginActions');

let refreshTimer: ReturnType<typeof setTimeout> | undefined;

type RoomServerTokenError = 'expired' | 'invalid' | undefined;

function getRoomServerTokenError(e: unknown): RoomServerTokenError {
	const msg = (e instanceof Error && e.message) ? e.message : String(e);
	const s = msg.toLowerCase();

	if (s.includes('token expired'))
		return 'expired';

	if (s.includes('invalid token'))
		return 'invalid';

	return undefined;
}

async function handleUpdateTokenError(
	e: unknown,
	dispatch: unknown,
	actionName: string
): Promise<boolean> {
	const t = getRoomServerTokenError(e);

	logger.error('%s updateToken failed [error: %o]', actionName, e);

	if (t === 'expired' || t === 'invalid') {

		// eslint-disable-next-line no-unused-vars
		await (dispatch as unknown as (a: unknown) => Promise<unknown>)(expireToken());

		return true;
	}

	return false;
}

function getJwtExpMs(token: string): number | undefined {
	try {
		const decoded = jwtDecode<JwtPayload>(token);

		if (typeof decoded?.exp !== 'number')
			return undefined;

		return decoded.exp * 1000;
	} catch (e) {
		logger.error('getJwtExpMs could not decode token [error: %o]', e);

		return undefined;
	}
}

function clearRefreshTimer(): void {
	if (refreshTimer) {
		clearTimeout(refreshTimer);
		refreshTimer = undefined;
	}
}

function scheduleRefresh(token: string, refreshNow: () => void): void {
	const expMs = getJwtExpMs(token);

	if (!expMs)
		return;

	const refreshBeforeMs = 5 * 60 * 1000;
	const delay = expMs - Date.now() - refreshBeforeMs;

	clearRefreshTimer();

	if (delay <= 0) {
		// Avoid tight refresh loops if the token is already close to expiry
		// Try again soon with a small backoff.
		const minDelayMs = 30 * 1000;

		refreshTimer = setTimeout(() => {
			refreshNow();
		}, minDelayMs);

		return;
	}

	refreshTimer = setTimeout(() => {
		refreshNow();
	}, delay);
}

export const refreshTokenNow = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ managementService, signalingService }
): Promise<void> => {
	const token = getState()?.permissions?.token;

	// No token -> nothing to refresh
	if (!token)
		return;

	try {
		const svc = await managementService;
		const authResult = await svc.reAuthenticate() as unknown;
		const newToken = (authResult as { accessToken?: string } | null | undefined)?.accessToken;

		if (!newToken)
			throw new Error('No accessToken from reAuthenticate');

		await svc.authentication.setAccessToken(newToken);

		dispatch(permissionsActions.setToken(newToken));
		dispatch(syncSignalingUrl({ token: newToken }));

		if (getState().signaling.state === 'connected') {
			try {
				await signalingService.sendRequest('updateToken', { token: newToken });
			} catch (e) {
				const handled = await handleUpdateTokenError(e, dispatch, 'refreshTokenNow');

				if (handled)
					return;

				throw e;
			}
		}

		scheduleRefresh(newToken, () => { dispatch(refreshTokenNow()); });
	} catch (e) {
		logger.error('refreshTokenNow failed [error: %o]', e);

		// Refresh failed -> downgrade to guest
		await dispatch(expireToken());
	}
};

export const expireToken = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ managementService, signalingService }
): Promise<void> => {
	clearRefreshTimer();

	try {
		const svc = await managementService;

		await svc.authentication.removeAccessToken();
	} catch (e) {
		logger.error('removeAccessToken failed, will try fallback [error: %o]', e);

		try {
			localStorage.removeItem('feathers-jwt');
		} catch (e2) {
			logger.error('removing of feathers-jwt from localStorage failed [error: %o]', e2);
		}
	}

	dispatch(permissionsActions.setToken());
	dispatch(permissionsActions.setLoggedIn(false));
	dispatch(syncSignalingUrl({ token: null }));

	if (getState().signaling.state === 'connected')
		await signalingService.sendRequest('updateToken').catch((e: unknown) => logger.error('updateToken request failed [error: %o]', e));
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
	logger.debug('adminLogin() [email %s]', email);

	try {
		const admin = await (await managementService).authenticate({
			strategy: 'local',
			email: email,
			password: password
		});

		if (admin) {
			const accessToken = admin.accessToken;

			if (accessToken) {
				const authResult = await (await managementService).authenticate({ accessToken, strategy: 'jwt' });

				if (authResult.accessToken === accessToken) {
					dispatch(permissionsActions.setToken(accessToken));
					dispatch(permissionsActions.setLoggedIn(true));
					dispatch(syncSignalingUrl({ token: accessToken }));
					scheduleRefresh(accessToken, () => { dispatch(refreshTokenNow()); });
				}
			}
		}
	} catch (error) {
		logger.error('AdminLogin [error:%o]', error);

		dispatch(notificationsActions.enqueueNotification({
			message: 'Invalid login',
			options: { variant: 'error' }
		}));
	}

	if (getState().signaling.state === 'connected') {
		await signalingService.sendRequest('updateToken').catch(async (e: unknown) => {
			await handleUpdateTokenError(e, dispatch, 'adminLogin');
		});
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

	/* 	logger.debug('checkJWT() token : %s', accessToken); */

	if (accessToken) {
		try {
			const authResult = await (await managementService).authenticate({ accessToken, strategy: 'jwt' });

			if (authResult.accessToken === accessToken) {
				loggedIn = true;
				dispatch(permissionsActions.setToken(accessToken));
				dispatch(syncSignalingUrl({ token: accessToken }));
				scheduleRefresh(accessToken, () => { dispatch(refreshTokenNow()); });
			} else {
				clearRefreshTimer();
				dispatch(permissionsActions.setToken());
				dispatch(syncSignalingUrl({ token: null }));
				await (await managementService).authentication.removeAccessToken();
			}
		} catch (e) {
			logger.error('checkJWT authenticate failed [error: %o]', e);

			clearRefreshTimer();

			dispatch(permissionsActions.setToken());
			dispatch(syncSignalingUrl({ token: null }));
			await (await managementService).authentication.removeAccessToken().catch((e2: unknown) => logger.error('removeAccessToken failed [error: %o]', e2));
		}
	} else {
		clearRefreshTimer();
	}

	dispatch(permissionsActions.setLoggedIn(loggedIn));

	if (getState().signaling.state === 'connected') {
		await signalingService.sendRequest('updateToken').catch(async (e: unknown) => {
			await handleUpdateTokenError(e, dispatch, 'checkJWT');
		});
	}
};

export const logout = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService, managementService, config }
): Promise<void> => {
	logger.debug('logout()');

	clearRefreshTimer();

	const tenantId = await dispatch(getTenantFromFqdn(window.location.hostname));

	await (await managementService).authentication.removeAccessToken();

	dispatch(permissionsActions.setToken());
	dispatch(permissionsActions.setLoggedIn(false));
	dispatch(syncSignalingUrl({ token: null }));

	dispatch(managamentActions.clearUser());

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
