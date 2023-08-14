import { Middleware } from '@reduxjs/toolkit';
import { Logger } from 'edumeet-common';
import { AppDispatch } from '../store';
import { settingsActions } from '../slices/settingsSlice';
import { updatePreviewWebcam } from '../actions/mediaActions';

const logger = new Logger('EffectsMiddleware');

const createEffectsMiddleware = (): Middleware => {
	logger.debug('createEffectsMiddleware()');

	const middleware: Middleware = ({
		dispatch
	}: {
		dispatch: AppDispatch,
	}) =>
		(next) => (action) => {
			if (settingsActions.setBlurBackground.match(action)) {
				dispatch(updatePreviewWebcam({ restart: true }));
			}

			return next(action);
		};
	
	return middleware;
};

export default createEffectsMiddleware;