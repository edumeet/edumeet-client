import { Middleware } from '@reduxjs/toolkit';
import { Logger } from 'edumeet-common';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';

const logger = new Logger('ChatMiddleware');

const createChatMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createChatMiddleware()');

	const middleware: Middleware = ({
		dispatch
	}: {
		dispatch: AppDispatch,
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

			return next(action);
		};
	
	return middleware;
};

export default createChatMiddleware;