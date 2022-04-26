import { Logger } from '../../utils/logger';
import { ChatMessage } from '../../utils/types';
import { chatActions } from '../slices/chatSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';

const logger = new Logger('ChatActions');

export const sendChat = (message: string) => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('sendChat() [message:"%s"]', message);

	const id = getState().me.id;

	const chatMessage = {
		peerId: id,
		type: 'message',
		time: Date.now(),
		text: message
	} as ChatMessage;

	try {
		await signalingService.sendRequest('chatMessage', { chatMessage });

		dispatch(chatActions.addMessage(chatMessage));
	} catch (error) {
		logger.error('sendChat() [error:"%o"]', error);
	}
};