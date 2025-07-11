import { Logger } from '../../utils/Logger';
import { notificationsActions } from '../slices/notificationsSlice';
import { permissionsActions } from '../slices/permissionsSlice';
import { AppThunk } from '../store';

const logger = new Logger('ManagementActions');

export const getTenantFromFqdn = (fqdn: string): AppThunk<Promise<string | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<string | undefined> => {
	logger.debug('getTenantFromFqdn() [fqdn:%s]', fqdn);

	let tenantId: string | undefined;

	try {
		const { data } = await (await managementService).service('tenantFQDNs').find({ query: { fqdn, $limit: 1 } });

		tenantId = data[0]?.tenantId;
	} catch (error) {}

	return tenantId;
};

export const createRoom = (roomName: string): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<void> => {
	logger.debug('createRoom() [roomName:%s]', roomName);

	try {
		await (await managementService).service('rooms').create({
			name: roomName
		});
	} catch (error) {
		if (error instanceof Error) {
			dispatch(notificationsActions.enqueueNotification({
				message: `Failed to get data: ${error.toString()}`,
				options: { variant: 'error' }
			}));
		}
	}
};

export const getData = (serviceName:string): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('getData() [serviceName:%s]', serviceName);

	let data: object | undefined;

	try {
		data = await (await managementService).service(serviceName).find(
			{
				query: {
					$sort: {
						id: 1,
						$limit: 9999
					
					}
				}
			}
		);
	
	} catch (error) {
		if (error instanceof Error) {
			dispatch(notificationsActions.enqueueNotification({
				message: `Failed to get data: ${error.toString()}`,
				options: { variant: 'error' }
			}));
		}
	}

	return data;
};

export const getDataByID = (id:string|number, serviceName:string): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('getData() [serviceName:%s]', serviceName);

	let data: object | undefined;

	try {

		data = await (await managementService).service(serviceName).find(
			{
				query: {
					id: id,
					$sort: {
						id: 1,
						$limit: 9999
					}
				}
			}
		);
	
	} catch (error) {
		if (error instanceof Error) {
			dispatch(notificationsActions.enqueueNotification({
				message: `Failed to get data: ${error.toString()}`,
				options: { variant: 'error' }
			}));
		}
	}

	return data;
};
export const getDataByTenantID = (id:string|number, serviceName:string): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('getDataByTenantID() [serviceName:%s]', serviceName);

	let data: object | undefined;

	try {

		data = await (await managementService).service(serviceName).find(
			{
				query: {
					tenantId: id,
					$sort: {
						id: 1,
						$limit: 9999
					}
				}
			}
		);
	
	} catch (error) {
		if (error instanceof Error) {
			dispatch(notificationsActions.enqueueNotification({
				message: `Failed to get data: ${error.toString()}`,
				options: { variant: 'error' }
			}));
		}
	}

	return data;
};

export const getDataByRoomId = (roomId:string|number, serviceName:string): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('getData() [serviceName:%s]', serviceName);

	let data: object | undefined;

	try {

		data = await (await managementService).service(serviceName).find(
			{
				query: {
					roomId: roomId,
					$sort: {
						id: 1
					}
				}
			}
		);
	
	} catch (error) {
		if (error instanceof Error) {
			dispatch(notificationsActions.enqueueNotification({
				message: `Failed to get data: ${error.toString()}`,
				options: { variant: 'error' }
			}));
		}
	}

	return data;
};

export const deleteData = (id : number, serviceName:string): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('deleteData() [id:%s] [serviceName:%s]', [ id, serviceName ]);

	let data: object | undefined;

	try {
		data = await (await managementService).service(serviceName).remove(
			id
		);
		dispatch(notificationsActions.enqueueNotification({
			message: 'Delete successfull',
			options: { variant: 'success' }
		}));

	} catch (error) {
		if (error instanceof Error) {
			dispatch(notificationsActions.enqueueNotification({
				message: `Delete unsuccessful: ${error.toString()}`,
				options: { variant: 'error' }
			}));
		}

	}

	return data;
};

export const createData = (params : object, serviceName:string): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('createData() [params:%s] [serviceName:%s]', [ JSON.stringify(params), serviceName ]);

	let data: object | undefined;

	try {
		data = await (await managementService).service(serviceName).create(
			params
		);

		dispatch(notificationsActions.enqueueNotification({
			message: 'Creation successfull',
			options: { variant: 'success' }
		}));
	} catch (error) {
		if (error instanceof Error) {
			dispatch(notificationsActions.enqueueNotification({
				message: `Creation unsuccessful: ${error.toString()}`,
				options: { variant: 'error' }
			}));
		}
	}

	return data;
};

export const patchData = (id : number, params : object, serviceName : string): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('patchData() [id:%s] [params:%s] [serviceName:%s]', [ id, JSON.stringify(params), serviceName ]);

	let data: object | undefined;

	try {
		data = await (await managementService).service(serviceName).patch(
			id,
			params
		);

		dispatch(notificationsActions.enqueueNotification({
			message: 'Modification successfull',
			options: { variant: 'success' }
		}));
	} catch (error) {
		if (error instanceof Error) {
			dispatch(notificationsActions.enqueueNotification({
				message: `Modification unsuccessful: ${error.toString()}`,
				options: { variant: 'error' }
			}));
		}
	}

	return data;
};

export const getUserData = (): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('getUserData()',);

	let data: object | undefined;

	try {
		data = await (await managementService).reAuthenticate();
	} catch (error) {
		
	}

	return data;
};

export const getRoomByName = (name: string): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {
	
	logger.debug('getRooms()');
	
	let data: object | undefined;
	
	const serviceName='rooms';
	
	try {
		data = await (await managementService).service(serviceName).find(
			{
				query: {
					name: name,
					$sort: {
						id: 1
					}
				}
			}
		);
	} catch (error) {}
	
	return data;
};

export const createRoomWithParams = (params : object): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('createRoomWithParams()');

	let data: object | undefined;

	const serviceName='rooms';

	try {
		data = await (await managementService).service(serviceName).create(
			params
		);
	
	} catch (error) {
		if (error instanceof Error) {
			dispatch(notificationsActions.enqueueNotification({
				message: `Creation unsuccessful: ${error.toString()}`,
				options: { variant: 'error' }
			}));
		}			
	}

	return data;
};

// eslint-disable-next-line no-unused-vars
let messageListener: (event: MessageEvent) => void;

export const startMGMTListeners = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService, managementService }
): Promise<void> => {
	logger.debug('startMGMTListeners()');

	messageListener = async ({ data }: MessageEvent) => {
		if (data.type === 'edumeet-login') {
			const { data: token } = data;

			await (await managementService).authentication.setAccessToken(token);

			dispatch(permissionsActions.setToken(token));
			dispatch(permissionsActions.setLoggedIn(true));

			if (getState().signaling.state === 'connected')
				await signalingService.sendRequest('updateToken', { token }).catch((e) => logger.error('updateToken request failed [error: %o]', e));
		}
	};

	window.addEventListener('message', messageListener);
};

export const stopMGMTListeners = (): AppThunk<Promise<void>> => async (): Promise<void> => {
	logger.debug('stopListeners()');
	window.removeEventListener('message', messageListener);
};