import { Middleware } from '@reduxjs/toolkit';
import { Logger } from 'edumeet-common';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { roomServerConnectionError } from '../../components/translated/translatedComponents';
import { notificationsActions } from '../slices/notificationsSlice';
import { RoomServerConnection } from '../../utils/RoomServerConnection';
import { leaveRoom } from '../actions/roomActions';

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

				signalingService.on('error', (error) => {
					dispatch(notificationsActions.enqueueNotification({
						message: roomServerConnectionError(error.message),
						options: { variant: 'error' }
					}));
				});

				signalingService.once('close', () => {
					dispatch(leaveRoom());
				});
				
				const { url } = getState().signaling;
				const socketConnection = RoomServerConnection.create({ url });

				signalingService.addConnection(socketConnection);
			}

			if (signalingActions.disconnect.match(action)) {
				signalingService.removeAllListeners();
				signalingService.disconnect();
			}

			return next(action);
		};

	return middleware;
};

export default createSignalingMiddleware;