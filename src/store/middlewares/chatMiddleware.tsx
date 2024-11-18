import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { uiActions } from '../slices/uiSlice';
import { Logger } from '../../utils/Logger';

const logger = new Logger('ChatMiddleware');

const createChatMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createChatMiddleware()');

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: () => RootState
	}) =>
		(next) => (action) => {
			if (signalingActions.connect.match(action)) {
				signalingService.on('notification', (notification) => {
					try {
						switch (notification.method) {
							case 'chatMessage': {
								const { chatMessage } = notification.data;

								dispatch(roomSessionsActions.addMessage(chatMessage));
								break;
							}

							case 'moderator:clearChat': {
								dispatch(roomSessionsActions.clearChat());

								break;
							}
						}
					} catch (error) {
						logger.error('error on signalService "notification" event [error:%o]', error);
					}
				});
			}

			if (
				roomSessionsActions.addMessage.match(action) &&
				action.payload.peerId !== getState().me.id &&
				action.payload.sessionId === getState().me.sessionId &&
				!getState().ui.chatOpen
			) {
				dispatch(uiActions.addToUnreadMessages());
			}

			return next(action);
		};
	
	return middleware;
};

export default createChatMiddleware;
