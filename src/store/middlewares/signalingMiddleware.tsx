import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { Logger } from '../../utils/logger';

const logger = new Logger('SignalingMiddleware');

const createSignalingMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createSignalingMiddleware()');

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: RootState
	}) =>
		(next) => (action) => {
			if (signalingActions.connect.match(action)) {
				signalingService.on('connect', () => {
					dispatch(signalingActions.connected());
				});

				signalingService.on('disconnect', () => {
					dispatch(signalingActions.disconnected());
				});

				signalingService.on('reconnect', () => {
					// Reconnecting TODO
				});

				signalingService.connect(getState().signaling);
			}

			return next(action);
		};

	return middleware;
};

export default createSignalingMiddleware;