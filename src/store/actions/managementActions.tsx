import edumeetConfig from '../../utils/edumeetConfig';
import { Logger } from '../../utils/Logger';
import { notificationsActions } from '../slices/notificationsSlice';
import { updateLoginState } from './permissionsActions';
import { AppThunk } from '../store';

const logger = new Logger('ManagementActions');

const handleAuthError = (error: unknown): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ managementService }
): Promise<void> => {
	if (typeof error === 'object' && error !== null &&
		'code' in error && (error as { code?: number }).code === 401) {
		logger.error('401 NotAuthenticated or JWT expired - logging out');

		await (await managementService).authentication.removeAccessToken();

		dispatch(updateLoginState());
	}
};

export const getTenantFromFqdn = (fqdn: string): AppThunk<Promise<string | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<string | undefined> => {
	logger.debug('getTenantFromFqdn() [fqdn:%s]', fqdn);

	let tenantId: string | undefined;

	try {
		const { data } = await (await managementService).service('tenantFQDNs').find({ query: { fqdn, $limit: 1 } });

		tenantId = data[0]?.tenantId;
	} catch (error) {
		logger.error('getTenantFromFqdn  [error:%o]', error);
		dispatch(handleAuthError(error));
	}

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
		dispatch(handleAuthError(error));
	}
};

interface PaginatedResult {
	total: number;
	limit: number;
	skip: number;
	data: unknown[];
}

export const getData = (serviceName: string): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('getData() [serviceName:%s]', serviceName);

	let data: PaginatedResult | undefined;

	let tmpdata: PaginatedResult | undefined;

	try {
		const svc = (await managementService).service(serviceName);

		let increment = 1;

		const init = await svc.find(
			{
				query: {
					$limit: 9999,
					$sort: {
						id: 1,

					}
				}
			}
		) as PaginatedResult;

		data = init;

		while (init.limit * increment <= init.total && init.total!=0) {
			tmpdata = await svc.find(
				{
					query: {
						$limit: 9999,
						$skip: init.limit * increment,
						$sort: {
							id: 1,

						}
					}
				}
			) as PaginatedResult;
			if (data && data.hasOwnProperty('data') && tmpdata && tmpdata.hasOwnProperty('data'))
				data.data.push(...tmpdata.data);
			increment++;
		}

	} catch (error) {
		if (error instanceof Error) {
			dispatch(notificationsActions.enqueueNotification({
				message: `Failed to get data: ${error.toString()}`,
				options: { variant: 'error' }
			}));
		}
		dispatch(handleAuthError(error));
	}

	return data;
};

export const getDataByID = (id: string | number, serviceName: string): AppThunk<Promise<object | undefined>> => async (
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
					$limit: 9999,
					$sort: {
						id: 1,

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
		dispatch(handleAuthError(error));
	}

	return data;
};
export const getDataByTenantID = (id: string | number, serviceName: string): AppThunk<Promise<object | undefined>> => async (
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
					$limit: 9999,
					$sort: {
						id: 1,
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
		dispatch(handleAuthError(error));
	}

	return data;
};

export const getDataByRoomId = (roomId: string | number, serviceName: string): AppThunk<Promise<object | undefined>> => async (
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
					$limit: 9999,
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
		dispatch(handleAuthError(error));
	}

	return data;
};

export const deleteData = (id: number, serviceName: string): AppThunk<Promise<object | undefined>> => async (
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
		dispatch(handleAuthError(error));

	}

	return data;
};

export const createData = (params: object, serviceName: string): AppThunk<Promise<object | undefined>> => async (
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
		dispatch(handleAuthError(error));
	}

	return data;
};

export const patchData = (id: number, params: object, serviceName: string): AppThunk<Promise<object | undefined>> => async (
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
		dispatch(handleAuthError(error));
	}

	return data;
};

export const getUserData = (): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('getUserData()',);

	let data: object | undefined;

	try {
		data = await (await managementService).reAuthenticate();
	} catch (error) {
		logger.error('getUserData [error:%o]', error);
		dispatch(handleAuthError(error));
	}

	return data;
};

export const getRoomByName = (name: string): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('getRooms()');

	let data: object | undefined;

	const serviceName = 'rooms';

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
	} catch (error) { 
		logger.error('getRoomByName [error:%o]', error);
		dispatch(handleAuthError(error));
	}

	return data;
};

export const createRoomWithParams = (params: object): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('createRoomWithParams()');

	let data: object | undefined;

	const serviceName = 'rooms';

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
		dispatch(handleAuthError(error));
	}

	return data;
};

export const getUserByEmail = (email: string): AppThunk<Promise<object | undefined>> => async (
	dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('getUserByEmail() [email:%s]', email);

	let data: object | undefined;

	const serviceName = 'users';

	try {
		data = await (await managementService).service(serviceName).find(
			{
				query: {
					email: email,
					$limit: 1,
					$sort: {
						id: 1
					}
				}
			}
		) as PaginatedResult;
	} catch (error) {
		if (error instanceof Error) {
			dispatch(notificationsActions.enqueueNotification({
				message: `Failed to get user by email: ${error.toString()}`,
				options: { variant: 'error' }
			}));
		}
		dispatch(handleAuthError(error));
	}

	return data;
};

// eslint-disable-next-line no-unused-vars
let messageListener: (event: MessageEvent) => void;

export const startMGMTListeners = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ managementService }
): Promise<void> => {
	logger.debug('startMGMTListeners()');

	messageListener = async ({ data, origin }: MessageEvent) => {
		if (data.type === 'edumeet-login') {
			// validate origin
			const url = edumeetConfig.managementUrl;

			if (url) {
				const { host, protocol } = new URL(url);

				if (origin && origin === `${protocol}//${host}`) {
					const { data: token } = data;

					await (await managementService).authentication.setAccessToken(token);
					await (await managementService).reAuthenticate();

					dispatch(updateLoginState(token));
				}
			}

		}
	};

	window.addEventListener('message', messageListener);
};

export const stopMGMTListeners = (): AppThunk<Promise<void>> => async (): Promise<void> => {
	logger.debug('stopListeners()');
	window.removeEventListener('message', messageListener);
};