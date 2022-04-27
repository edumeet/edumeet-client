import { Middleware } from '@reduxjs/toolkit';
import { Logger } from '../../utils/logger';
import { chatActions } from '../slices/chatSlice';
import { signalingActions } from '../slices/signalingSlice';
import { MiddlewareOptions } from '../store';

const logger = new Logger('ChatMiddleware');

const createChatMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createChatMiddleware()');

	const middleware: Middleware = ({ dispatch }) =>
		(next) => (action) => {
			if (signalingActions.connected.match(action)) {
				signalingService.on('notification', (notification) => {
					logger.debug(
						'signalingService "notification" event [method:%s, data:%o]',
						notification.method, notification.data);

					try {
						switch (notification.method) {
							case 'chatMessage': {
								const { chatMessage } = notification.data;

								dispatch(chatActions.addMessage(chatMessage));
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