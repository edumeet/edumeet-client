import { Logger } from '../../utils/logger';
import { chatActions } from '../slices/chatSlice';
import { AppThunk } from '../store';

const logger = new Logger('ChatActions');

/**
 * This thunk action sends a chat message.
 * 
 * @param message - Message to send.
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const sendChat = (message: string): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
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

/**
 * This thunk action clears the chat for everyone.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const clearChat = (): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('clearChat()');

	try {
		await signalingService.sendRequest('moderator:clearChat');

		dispatch(chatActions.clearChat());
	} catch (error) {
		logger.error('clearChat() [error:%o]', error);
	}
};