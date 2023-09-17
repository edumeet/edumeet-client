import { Logger } from 'edumeet-common';
import { AppThunk } from '../store';
import { notificationsActions } from '../slices/notificationsSlice';
import { mgmtSvcUnavailable } from '../../components/translated/translatedComponents';

const logger = new Logger('ManagementActions');

export const getTenantFromFqdn = (fqdn: string): AppThunk<Promise<string | undefined>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<string | undefined> => {
	logger.debug('getTenantFromFqdn() [fqdn:%s]', fqdn);

	let tenantId: string | undefined;

	try {
		const { data } = await managementService.service('tenantFQDNs').find({ query: { fqdn, $limit: 1 } });

		tenantId = data[0]?.tenantId;
	} catch (error) {
		const { message } = error as Error;

		if (message === 'Failed to fetch')
			_dispatch(notificationsActions.enqueueNotification({
				message: mgmtSvcUnavailable(),
				options: { variant: 'error' }
			}));
		logger.error('getTenantFromFqdn() [error:%o]', error);
	}

	return tenantId;
};

export const createRoom = (roomName: string): AppThunk<Promise<void>> => async (
	_dispatch,
	_getState,
	{ managementService }
): Promise<void> => {
	logger.debug('createRoom() [roomName:%s]', roomName);

	await managementService.service('rooms').create({
		name: roomName
	});
};