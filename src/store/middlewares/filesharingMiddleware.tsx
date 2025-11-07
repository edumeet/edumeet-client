import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { Logger } from '../../utils/Logger';
import { uiActions } from '../slices/uiSlice';
import { filesLengthSelector } from '../selectors';

const logger = new Logger('FilesharingMiddleware');

const createFilesharingMiddleware = ({
	signalingService, fileService
}: MiddlewareOptions): Middleware => {
	logger.debug('createFilesharingMiddleware()');

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
							case 'sendFile': {
								const { file } = notification.data;

								dispatch(roomSessionsActions.addFile(file));
								break;
							}
							case 'clearFile': {
								const { magnetURI } = notification.data;

								dispatch(roomSessionsActions.clearFile({ magnetURI }));
								
								const state = getState();

								if (!state.ui.filesharingOpen &&
									state.ui.unseenFiles > 0 &&
									filesLengthSelector(state) === 0 
								) {
									dispatch(uiActions.resetUnseenFiles());
								}

								fileService.removeFile(magnetURI);

								break;
							}

							case 'moderator:clearFiles': {
								dispatch(roomSessionsActions.clearFiles());
								dispatch(uiActions.resetUnseenFiles());

								fileService.removeFiles();

								break;
							}
						}
					} catch (error) {
						logger.error('error on signalService "notification" event [error:%o]', error);
					}
				});
			}

			if (
				roomSessionsActions.addFile.match(action) &&
				action.payload.peerId !== getState().me.id &&
				action.payload.sessionId === getState().me.sessionId &&
				!getState().ui.filesharingOpen
			) {
				dispatch(uiActions.addToUnseenFiles());
			}

			return next(action);
		};
	
	return middleware;
};

export default createFilesharingMiddleware;
