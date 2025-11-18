import { permissionsActions } from '../slices/permissionsSlice';
import { AppThunk } from '../store';
import { roomActions } from '../slices/roomSlice';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { getTenantFromFqdn } from './managementActions';
import { Logger } from '../../utils/Logger';
import { notificationsActions } from '../slices/notificationsSlice';

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

	}
	window.open(`${config.managementUrl}/oauth/tenant?tenantId=${tenantId}`, 'loginWindow');
};

export const adminLogin = (email: string, password:string): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService, managementService }
): Promise<void> => {
	logger.debug('adminLogin() [email s%]', email);

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
			}
		}
	}
	if (getState().signaling.state === 'connected')
		await signalingService.sendRequest('updateToken').catch((e) => logger.error('updateToken request failed [error: %o]', e));
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
		const authResult = await (await managementService).authenticate({ accessToken, strategy: 'jwt' });

		if (authResult.accessToken === accessToken) {
			loggedIn=true;
			dispatch(permissionsActions.setToken(accessToken));
		} else {
			await (await managementService).authentication.removeAccessToken();
			dispatch(permissionsActions.setToken());
		}
	}
	
	dispatch(permissionsActions.setLoggedIn(loggedIn));
	
	if (getState().signaling.state === 'connected')
		await signalingService.sendRequest('updateToken').catch((e) => logger.error('updateToken request failed [error: %o]', e));
};

export const logout = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService, managementService }
): Promise<void> => {
	logger.debug('logout()');

	await (await managementService).authentication.removeAccessToken();

	dispatch(permissionsActions.setToken());
	dispatch(permissionsActions.setLoggedIn(false));

	if (getState().signaling.state === 'connected')
		await signalingService.sendRequest('updateToken').catch((e) => logger.error('updateToken request failed [error: %o]', e));
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
