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
import {
	invalidLoginLabel,
	loginTabBlockedLabel,
	noTenantFoundLabel,
	sessionEndedLabel
} from '../../components/translated/translatedComponents';

const logger = new Logger('PermissionsActions');

// Holds the pending token-refresh timer so it can be cancelled on logout.
let tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // refresh 5 min before expiry

export const REFRESH_RETRY_DELAYS_MS = [ 5_000, 15_000, 30_000, 60_000, 120_000 ];

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

	// Opened before any await: browsers only allow a new tab inside the click itself.
	const loginTab = window.open('about:blank', 'loginWindow');

	if (!loginTab) {
		dispatch(notificationsActions.enqueueNotification({
			message: loginTabBlockedLabel(),
			options: { variant: 'error' }
		}));

		return logger.error('login() | the browser blocked the login tab');
	}

	const tenantId = await dispatch(getTenantFromFqdn(window.location.hostname));

	if (!tenantId) {
		loginTab.close();

		dispatch(notificationsActions.enqueueNotification({
			message: noTenantFoundLabel(),
			options: { variant: 'error' }
		}));

		return logger.error('login() | no tenant found');
	}

	const params = new URLSearchParams({
		tenantId: String(tenantId),
		origin: window.location.origin
	});

	loginTab.location.href = `${config.managementUrl}/oauth/tenant?${params.toString()}`;
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
			message: invalidLoginLabel(),
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

				const is401 = typeof error === 'object' && error !== null &&
					'code' in error && (error as { code?: number }).code === 401;

				if (is401) {
					token = undefined;
					await management.authentication.removeAccessToken();
				} else {
					// Transient error (network, 5xx, request abort, etc.) — keep the token.
					// The user is still authenticated; the next checkJWT() call will retry.
					token = undefined;
				}
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

	const idToken = localStorage.getItem('oidcIdToken');

	localStorage.removeItem('oidcIdToken');

	await (await managementService).authentication.removeAccessToken();

	dispatch(updateLoginState());

	// Local-only logins (super-admin, tenant users with local creds) have no
	// OIDC session to terminate — removeAccessToken above is sufficient.
	if (!idToken) {
		return;
	}

	const tenantId = await dispatch(getTenantFromFqdn(window.location.hostname));

	if (!tenantId) {
		dispatch(notificationsActions.enqueueNotification({
			message: noTenantFoundLabel(),
			options: { variant: 'error' }
		}));

		return logger.error('logout() | no tenant found');
	}

	const params = new URLSearchParams({
		tenantId: String(tenantId),
		// eslint-disable-next-line camelcase
		id_token_hint: idToken,
	});

	window.open(`${config.managementUrl}/auth/logout?${params.toString()}`, 'logoutWindow');
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

export const refreshToken = (attempt = 0): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ managementService }
): Promise<void> => {
	logger.debug('refreshToken() [attempt: %d]', attempt);

	const sentToken = getState().permissions.token;
	const signedInOrOutMeanwhile = () => getState().permissions.token !== sentToken;

	try {
		const management = await managementService;
		const result = await management.service('token-refresh').create({});
		const newToken: string = result.accessToken;

		if (signedInOrOutMeanwhile()) {
			logger.debug('refreshToken() - the user signed in or out while refreshing, result ignored');

			return;
		}

		await management.authentication.setAccessToken(newToken);
		dispatch(updateLoginState(newToken));

		const { exp } = jwtDecode<JwtPayload>(newToken);

		logger.debug(
			'refreshToken() - token refreshed successfully, new expiry: %s',
			exp ? new Date(exp * 1000).toISOString() : 'unknown'
		);
	} catch (error) {
		if (signedInOrOutMeanwhile()) {
			logger.debug('refreshToken() - the user signed in or out while refreshing, error ignored [error: %o]', error);

			return;
		}

		const code = typeof error === 'object' && error !== null && 'code' in error
			? (error as { code?: unknown }).code
			: undefined;

		if (code === 401 || code === 403) {
			logger.warn('refreshToken() - session ended by the server [code: %s]', code);

			await (await managementService).authentication.removeAccessToken();

			const roomState = getState().room.state;

			dispatch(updateLoginState(undefined, { keepRoomIdentity: roomState === 'joined' || roomState === 'lobby' }));
			dispatch(notificationsActions.enqueueNotification({
				message: sessionEndedLabel(),
				options: { variant: 'warning' }
			}));

			return;
		}

		const delay = REFRESH_RETRY_DELAYS_MS[attempt];

		if (delay === undefined) {
			logger.error('refreshToken() - failed, giving up [error: %o]', error);

			return;
		}

		logger.warn('refreshToken() - failed, retrying in %d s [error: %o]', delay / 1000, error);

		tokenRefreshTimer = setTimeout(() => {
			dispatch(refreshToken(attempt + 1));
		}, delay);
	}
};

export const updateLoginState = (
	inputToken?: string,
	{ keepRoomIdentity = false }: { keepRoomIdentity?: boolean } = {}
): AppThunk<void> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('updateLoginState() [keepRoomIdentity: %s]', keepRoomIdentity);

	const token = inputToken && inputToken.length > 0 ? inputToken : undefined;

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

	// The room server keeps the identity the peer joined with; the next join uses the new state.
	if (keepRoomIdentity) return;

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