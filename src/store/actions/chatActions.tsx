import { Logger } from '../../utils/logger';
import { chatActions } from '../slices/chatSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';

const logger = new Logger('ChatActions');

export const sendChat = (message: string) => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('sendChat() [message:"%s"]', message);

	try {
		await signalingService.sendRequest('chatMessage', { text: message });

		const peerId = getState().me.id;
		const displayName = getState().settings.displayName;
		const timestamp = Date.now();

		dispatch(chatActions.addMessage({
			peerId,
			displayName,
			timestamp,
			text: message
		}));
	} catch (error) {
		logger.error('sendChat() [error:"%o"]', error);
	}
};

export const clearChat = () => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('clearChat()');

	try {
		await signalingService.sendRequest('moderator:clearChat');

		dispatch(chatActions.clearChat());
	} catch (error) {
		logger.error('clearChat() [error:%o]', error);
	}
};