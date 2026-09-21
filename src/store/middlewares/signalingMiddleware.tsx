import { roomActions } from '../slices/roomSlice';
import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { roomServerConnectionError, signalingReconnectingLabel } from '../../components/translated/translatedComponents';
import { notificationsActions } from '../slices/notificationsSlice';
import { RoomServerConnection } from '../../utils/RoomServerConnection';
import { leaveRoom, reconnectRoom } from '../actions/roomActions';
import { Logger } from '../../utils/Logger';
import { BOT_RETRY_INTERVAL_MS } from '../../utils/botJobs';

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
	signalingService,
	mediaService
}: MiddlewareOptions): Middleware => {
	logger.debug('createSignalingMiddleware()');

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: () => RootState
	}) => {
		let retrying = false;
		let retryTimer: ReturnType<typeof setTimeout> | undefined;

		const openConnection = async (): Promise<void> => {
			const socketConnection = await RoomServerConnection.create({
				getUrl: () => getState().signaling.url,
				getAuth: (): Record<string, string> => {
					const { botToken } = getState().me;

					return botToken ? { botToken } : {};
				},
			});

			signalingService.addConnection(socketConnection);
		};

		return (next) => (action) => {
			if (signalingActions.connect.match(action)) {
				signalingService.on('connected', () => {
					dispatch(signalingActions.connected());
				});

				signalingService.on('reconnecting', (attempt) => {
					logger.debug('reconnecting [attempt:%d]', attempt);

					dispatch(signalingActions.reconnecting());
					dispatch(notificationsActions.enqueueNotification({
						message: signalingReconnectingLabel(attempt),
						options: { variant: 'warning' }
					}));
				});

				signalingService.on('disconnected', (reason) => {
					logger.debug('disconnected [reason:%s]', reason);

					mediaService.monitor?.addIssue({
						type: 'websocket-disconnected',
						payload: { reason },
					});
				});

				signalingService.on('reconnected', () => {
					logger.debug('reconnected');

					dispatch(signalingActions.reconnected());
					dispatch(reconnectRoom());
				});

				signalingService.on('error', (error) => {
					if (getState().signaling.state !== 'reconnecting') {
						dispatch(notificationsActions.enqueueNotification({
							message: roomServerConnectionError(error.message),
							options: { variant: 'error' }
						}));
					}
				});

				signalingService.on('close', () => {
					// A connection dropped to be made again is not the room being left.
					if (retrying) return;

					dispatch(roomActions.setLeaveReason('connectionClosed'));
					dispatch(leaveRoom());
				});

				void openConnection();
			}

			if (signalingActions.retry.match(action)) {
				retrying = true;
				signalingService.disconnect();

				clearTimeout(retryTimer);
				retryTimer = setTimeout(() => {
					retrying = false;
					void openConnection();
				}, BOT_RETRY_INTERVAL_MS);
			}

			if (signalingActions.disconnect.match(action)) {
				// A page that leaves while it waits to try again must not come back.
				clearTimeout(retryTimer);
				retrying = false;
				signalingService.removeAllListeners();
				signalingService.disconnect();
			}

			return next(action);
		};
	};

	return middleware;
};

export default createSignalingMiddleware;
