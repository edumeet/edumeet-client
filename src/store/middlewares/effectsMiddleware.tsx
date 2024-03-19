import { Middleware } from '@reduxjs/toolkit';
import { MiddlewareOptions } from '../store';
import { meActions } from '../slices/meSlice';
import { Logger } from '../../utils/Logger';

const logger = new Logger('EffectsMiddleware');

/**
 * @param options - Middleware options. 
 * @returns {Middleware} Redux middleware.
 */
const createEffectsMiddleware = ({
	effectsService,
}: MiddlewareOptions): Middleware => {
	logger.debug('createEffectsMiddleware()');

	const middleware: Middleware = () =>
		(next) => (action) => {
			if (meActions.setWebGLSupport.match(action)) {
				effectsService.webGLSupport = true;
			}

			return next(action);
		};
	
	return middleware;
};

export default createEffectsMiddleware;
