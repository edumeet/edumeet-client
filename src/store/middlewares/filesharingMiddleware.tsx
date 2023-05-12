import { Middleware } from '@reduxjs/toolkit';
import { Logger } from 'edumeet-common';
import { roomActions } from '../slices/roomSlice';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';

const logger = new Logger('FilesharingMiddleware');

const createFilesharingMiddleware = ({
	fileService,
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createFilesharingMiddleware()');

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: () => RootState
	}) =>
		(next) => (action) => {
			if (roomActions.setState.match(action) && action.payload === 'joined') {
				const iceServers = getState().webrtc.iceServers;

				fileService.init(iceServers);
			}

			if (signalingActions.connect.match(action)) {
				signalingService.on('notification', (notification) => {
					try {
						switch (notification.method) {
							case 'sendFile': {
								const { file } = notification.data;

								dispatch(roomSessionsActions.addFile(file));
								break;
							}

							case 'moderator:clearFiles': {
								dispatch(roomSessionsActions.clearFiles());

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