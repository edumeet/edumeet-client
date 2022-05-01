import { Logger } from '../../utils/logger';
import { meActions } from '../slices/meSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';

const logger = new Logger('MeActions');

export const setDisplayName = (displayName: string) => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('setDisplayName() [displayName:"%s"]', displayName);

	dispatch(meActions.setDispayNameInProgress(true));

	try {
		await signalingService.sendRequest('changeDisplayName', { displayName });

		dispatch(settingsActions.setDisplayName(displayName));
	} catch (error) {
		logger.error('setDisplayName() [error:"%o"]', error);

		// TODO: Notification about failed to set display name
	} finally {
		dispatch(meActions.setDispayNameInProgress(false));
	}
};