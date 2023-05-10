import { Logger } from 'edumeet-common';
import { AppThunk } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';

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
		const sessionId = getState().me.sessionId;

		await signalingService.sendRequest('chatMessage', { text: message, sessionId });

		const peerId = getState().me.id;
		const displayName = getState().settings.displayName;
		const timestamp = Date.now();

		dispatch(roomSessionsActions.addMessage({
			peerId,
			displayName,
			timestamp,
			text: message,
			sessionId,
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

		dispatch(roomSessionsActions.clearChat());
	} catch (error) {
		logger.error('clearChat() [error:%o]', error);
	}
};