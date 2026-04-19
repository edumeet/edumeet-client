import { Logger } from '../../utils/Logger';
import { AppThunk } from '../store';

const logger = new Logger('ModeratorPermissionsActions');

export interface PermissionsPeer {
	id: string;
	displayName?: string;
	permissions: string[];
}

export interface PermissionUpdate {
	peerId: string;
	permissions: string[];
}

export const fetchRoomPermissions = (): AppThunk<Promise<PermissionsPeer[]>> => async (
	_dispatch,
	_getState,
	{ signalingService }
): Promise<PermissionsPeer[]> => {
	logger.debug('fetchRoomPermissions()');

	const response = await signalingService.sendRequest('moderator:getPermissions') as
		{ peers: PermissionsPeer[] } | undefined;

	return response?.peers ?? [];
};

export const setRoomPermissions = (updates: PermissionUpdate[]): AppThunk<Promise<void>> => async (
	_dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('setRoomPermissions() [updates:%o]', updates);

	await signalingService.sendRequest('moderator:setPermissions', { updates });
};
