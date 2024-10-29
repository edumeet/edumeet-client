import { Logger } from '../../utils/Logger';
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
	_dispatch,
	_getState,
	{ managementService }
): Promise<void> => {
	logger.debug('createRoom() [roomName:%s]', roomName);

	await (await managementService).service('rooms').create({
		name: roomName
	});
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
		
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		
		// eslint-disable-next-line no-console
		console.error(error);
	}

	return data;
};

export const getTenants = (): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('getTenants()');

	let data: object | undefined;

	const serviceName='tenants';

	try {
		data = await (await managementService).service(serviceName).find(
			{
				query: {
					$sort: {
						id: 1
					}
				}
			}
		);
	
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}

	return data;
};

export const deleteTenant = (id : number): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('deleteTenant()');

	let data: object | undefined;

	const serviceName='tenants';

	try {
		data = await (await managementService).service(serviceName).remove(
			id
		);
	
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}

	return data;
};

export const createTenant = (name : string, description : string): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('createTenant()');

	let data: object | undefined;

	const serviceName='tenants';

	try {
		data = await (await managementService).service(serviceName).create(
			{ name: name, description: description }
		);
	
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}

	return data;
};

export const modifyTenant = (id : number, params : object): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('modifyTenant()');

	let data: object | undefined;

	const serviceName='tenants';

	try {
		data = await (await managementService).service(serviceName).patch(
			id,
			params
		);
	
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}

	return data;
};

export const getTenantFQDNs = (): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {
	
	logger.debug('getTenantFQDNs()');
	
	let data: object | undefined;
	
	const serviceName='tenantFQDNs';
	
	try {
		data = await (await managementService).service(serviceName).find(
			{
				query: {
					$sort: {
						id: 1
					}
				}
			}
		);
		
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}
	
	return data;
};

export const deleteTenantFQDN = (id : number): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('deleteTenantFQND()');

	let data: object | undefined;

	const serviceName='tenantFQDNs';

	try {
		data = await (await managementService).service(serviceName).remove(
			id
		);
	
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}

	return data;
};

export const createTenantFQDN = (params : object): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('createTenantFQDN()');

	let data: object | undefined;

	const serviceName='tenantFQDNs';

	try {
		data = await (await managementService).service(serviceName).create(
			params
		);
	
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}

	return data;
};

export const modifyTenantFQDN = (id : number, params : object): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('modifyTenantFQDN()');

	let data: object | undefined;

	const serviceName='tenantFQDNs';

	try {
		data = await (await managementService).service(serviceName).patch(
			id,
			params
		);
	
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}

	return data;
};

export const getTenantOAuths = (): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {
	
	logger.debug('getTenantOAuths()');
	
	let data: object | undefined;
	
	const serviceName='tenantOAuths';
	
	try {
		data = await (await managementService).service(serviceName).find(
			{
				query: {
					$sort: {
						id: 1
					}
				}
			}
		);
		
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}
	
	return data;
};

export const deleteTenantOAuth = (id : number): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('deleteTenantOAuth()');

	let data: object | undefined;

	const serviceName='tenantOAuths';

	try {
		data = await (await managementService).service(serviceName).remove(
			id
		);
	
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}

	return data;
};

export const createTenantOAuth = (params : object): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('createTenantOAuth()');

	let data: object | undefined;

	const serviceName='tenantOAuths';

	try {
		data = await (await managementService).service(serviceName).create(
			params
		);
	
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}

	return data;
};

export const modifyTenantOAuth = (id : number, params : object): AppThunk<Promise<object | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<object | undefined> => {

	logger.debug('modifyTenantOAuth()');

	let data: object | undefined;

	const serviceName='tenantOAuths';

	try {
		data = await (await managementService).service(serviceName).patch(
			id,
			params
		);
	
		// eslint-disable-next-line no-console
		console.log(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
	}

	return data;
};