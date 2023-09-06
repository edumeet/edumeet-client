import { Middleware } from '@reduxjs/toolkit';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { Logger } from 'edumeet-common';
import { mediaActions } from '../slices/mediaSlice';
import { meActions } from '../slices/meSlice';

const logger = new Logger('EffectsMiddleware');

/**
 * This middleware represents the connection between the
 * EffectsService, the Redux store and the React components.
 * 
 * @param options - Middleware options. 
 * @returns {Middleware} Redux middleware.
 */
const createEffectsMiddleware = ({
	effectService
}: MiddlewareOptions): Middleware => {
	logger.debug('createEffectsMiddleware()');

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: () => RootState
	}) =>
		(next) => async (action) => {
			if (mediaActions.setPreviewBlurBackground.match(action) && action.payload === false) {
				effectService.stopBlurEffect('preview');
			}

			if (mediaActions.setLiveBlurBackground.match(action) && action.payload === false) {
				effectService.stopBlurEffect('live');
			}

			if (meActions.setHasWebGLSupport.match(action) && action.payload === true) {
				effectService.webGLSupport = true;
			} 

			return next(action);
		};
	
	return middleware;
};

export default createEffectsMiddleware;