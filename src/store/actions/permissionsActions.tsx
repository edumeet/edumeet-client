import { permissionsActions } from '../slices/permissionsSlice';
import { AppThunk } from '../store';
import { roomActions } from '../slices/roomSlice';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { getTenantFromFqdn } from './managementActions';
import { Logger } from '../../utils/Logger';
import { notificationsActions } from '../slices/notificationsSlice';
import { managamentActions } from '../slices/managementSlice';
import { jwtDecode, JwtPayload } from 'jwt-decode';

const logger = new Logger('PermissionsActions');

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
	} else {
		logger.debug('updateLoginState() removing token and loggedIn=false');
		dispatch(permissionsActions.setToken());
		dispatch(permissionsActions.setLoggedIn(false));
		dispatch(managamentActions.clearUser());
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