import { AppThunk } from '../store';
import { permissionsActions } from '../slices/permissionsSlice';
import { Logger } from '../../utils/Logger';

const logger = new Logger('listenerActions');

let messageListener: (event: MessageEvent) => void;

export const startMGMTListeners = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService, managementService }
): Promise<void> => {
	logger.debug('startListeners()');

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

export const stopMGMTListeners = (): AppThunk<Promise<void>> => async (

): Promise<void> => {
	logger.debug('stopListeners()');
	window.removeEventListener('message', messageListener);
};
