import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { Logger } from '../../utils/logger';
import { SocketIOConnection } from '../../utils/SocketIOConnection';

const logger = new Logger('SignalingMiddleware');

/**
 * This middleware represents the connection between the
 * SignalingService, the Redux store and the React components.
 * 
 * It listens to the SignalingService events and dispatches
 * the corresponding Redux actions.
 * 
 * It also listens to the Redux actions and calls the
 * SignalingService methods.
 * 
 * This way the SignalingService and the Redux store are
 * kept in sync.
 * 
 * @param options - Middleware options.
 * @returns {Middleware} Redux middleware.
 */
const createSignalingMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createSignalingMiddleware()');

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: () => RootState
	}) =>
		(next) => (action) => {
			if (signalingActions.connect.match(action)) {
				signalingService.on('connected', () => {
					dispatch(signalingActions.connected());
				});

				/* signalingService.on('disconnect', () => {
					dispatch(signalingActions.disconnect());
				});

				signalingService.on('reconnect', () => {
					dispatch(signalingActions.reconnecting());
				}); */

				const { url } = getState().signaling;
				const socketConnection = SocketIOConnection.create({ url });

				signalingService.addConnection(socketConnection);
			}

			if (signalingActions.disconnect.match(action)) {
				signalingService.removeAllListeners();
				signalingService.close();
			}

			return next(action);
		};

	return middleware;
};

export default createSignalingMiddleware;