import { Middleware } from '@reduxjs/toolkit';
import { Logger } from '../../utils/Logger';

import { drawingActions } from '../slices/drawingSlice';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
// import { notificationsActions } from '../slices/notificationsSlice';
// import { drawingFinishedLabel } from '../../components/translated/translatedComponents';

const logger = new Logger('ChatMiddleware');

const createDrawingMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createChatMiddleware()');

	const middleware: Middleware = ({
		dispatch
	}: {
		dispatch: AppDispatch,
		getState: () => RootState
	}) =>
		(next) => (action) => {

			if (signalingActions.connect.match(action)) {
				signalingService.on('notification', (notification) => {
					try {
						switch (notification.method) {
							
							case 'moderator:enabledDrawing': {
 
								dispatch(drawingActions.enableDrawing());

								break;
							}

							case 'disabledDrawing': {
 
								dispatch(drawingActions.disableDrawing());

								break;
							}

							case 'settedDrawingBgColor': {

								const bgColor = notification.data.bgColor;

								dispatch(drawingActions.setDrawingBgColor(bgColor));

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

export default createDrawingMiddleware;