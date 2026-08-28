import { AppThunk } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { directMessagesActions } from '../slices/directMessagesSlice';
import { notificationsActions } from '../slices/notificationsSlice';
import { uiActions } from '../slices/uiSlice';
import { chatMessageFailedLabel } from '../../components/translated/translatedComponents';
import { Logger } from '../../utils/Logger';

const logger = new Logger('ChatActions');

/**
 * This thunk action sends a chat message.
 * 
 * @param message - Message to send.
 * @returns {AppThunk<Promise<boolean>>} Whether the message was sent.
 */
export const sendChat = (message: string): AppThunk<Promise<boolean>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<boolean> => {
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

		return true;
	} catch (error) {
		logger.error('sendChat() [error:"%o"]', error);

		dispatch(notificationsActions.enqueueNotification({
			message: chatMessageFailedLabel(),
			options: { variant: 'error' }
		}));

		return false;
	}
};

/**
 * This thunk action sends a private chat message to a single peer.
 * 
 * @param to - Id of the peer to send the message to.
 * @param message - Message to send.
 * @returns {AppThunk<Promise<boolean>>} Whether the message was sent.
 */
export const sendDirectChat = (to: string, message: string): AppThunk<Promise<boolean>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<boolean> => {
	logger.debug('sendDirectChat() [to:"%s"]', to);

	try {
		await signalingService.sendRequest('privateChatMessage', { text: message, to });

		const peerId = getState().me.id;
		const displayName = getState().settings.displayName;
		const timestamp = Date.now();

		dispatch(directMessagesActions.addDirectMessage({
			peerId: to,
			message: { peerId, to, displayName, timestamp, text: message },
			unread: false,
		}));

		return true;
	} catch (error) {
		logger.error('sendDirectChat() [error:"%o"]', error);

		dispatch(notificationsActions.enqueueNotification({
			message: chatMessageFailedLabel(),
			options: { variant: 'error' }
		}));

		return false;
	}
};

/**
 * This thunk action opens the private chat thread with a peer.
 * 
 * @param peerId - Id of the peer to chat with.
 * @returns {AppThunk<void>}
 */
export const openDirectChat = (peerId: string): AppThunk<void> => (
	dispatch,
	getState
): void => {
	logger.debug('openDirectChat() [peerId:"%s"]', peerId);

	const displayName = getState().peers[peerId]?.displayName;

	dispatch(directMessagesActions.openThread({ peerId, displayName }));
	dispatch(uiActions.setUi({ chatOpen: true, activeChatThread: peerId }));
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
