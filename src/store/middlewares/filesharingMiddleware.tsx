import { Middleware } from '@reduxjs/toolkit';
import { Logger } from '../../utils/logger';
import { filesharingActions } from '../slices/filesharingSlice';
import { roomActions } from '../slices/roomSlice';
import { signalingActions } from '../slices/signalingSlice';
import { MiddlewareOptions } from '../store';

const logger = new Logger('FilesharingMiddleware');

const createFilesharingMiddleware = ({
	fileService,
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createFilesharingMiddleware()');

	const middleware: Middleware = ({ dispatch, getState }) =>
		(next) => (action) => {
			if (roomActions.updateRoom.match(action) && action.payload.joined) {
				const iceServers = getState().room.iceServers;
				const tracker = getState().webrtc.tracker;

				fileService.init(tracker, iceServers);
			}

			if (signalingActions.connected.match(action)) {
				signalingService.on('notification', (notification) => {
					logger.debug(
						'signalingService "notification" event [method:%s, data:%o]',
						notification.method, notification.data);

					try {
						switch (notification.method) {
							case 'sendFile': {
								const { file } = notification.data;

								dispatch(filesharingActions.addFile(file));
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

export default createFilesharingMiddleware;