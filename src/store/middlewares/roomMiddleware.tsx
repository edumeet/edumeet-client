import { Middleware } from '@reduxjs/toolkit';
import { roomActions } from '../slices/roomSlice';
import { signalingActions } from '../slices/signalingSlice';
import { Logger } from '../../utils/logger';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { webrtcActions } from '../slices/webrtcSlice';
import { joinRoom } from '../actions/roomActions';
import { batch } from 'react-redux';

const logger = new Logger('RoomMiddleware');

const createRoomMiddleware = ({
	signalingService,
	mediaService
}: MiddlewareOptions): Middleware => {
	logger.debug('createRoomMiddleware()');

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: RootState
	}) =>
		(next) => (action) => {
			if (signalingActions.disconnect.match(action)) {
				dispatch(roomActions.setState('left'));
			}

			if (signalingActions.connect.match(action)) {
				signalingService.on('notification', (notification) => {
					try {
						switch (notification.method) {
							case 'roomReady': {
								const { turnServers } = notification.data;

								batch(() => {
									dispatch(webrtcActions.setIceServers(turnServers));
									dispatch(roomActions.setState('joined'));
									dispatch(joinRoom());
								});
								break;
							}

							case 'enteredLobby': {
								dispatch(roomActions.setState('lobby'));
								// TODO: send displayname and picture
								break;
							}

							case 'overRoomLimit': {
								dispatch(roomActions.setState('overRoomLimit'));
								break;
							}

							case 'roomBack': {
								dispatch(roomActions.setState('joined'));
								break;
							}

							case 'activeSpeaker': {
								const { peerId } = notification.data;
								const isMe = peerId === getState().me.id;

								dispatch(roomActions.setActiveSpeakerId({ peerId, isMe }));
								break;
							}
						}
					} catch (error) {
						logger.error('error on signalService "notification" event [error:%o]', error);
					}
				});
			}

			// TODO: reconnect states here

			if (roomActions.setMode.match(action)) {
				const roomMode = action.payload;

				if (roomMode === 'P2P')
					mediaService.enableP2P(getState().me.id);
				else
					mediaService.disableP2P();
			}

			return next(action);
		};

	return middleware;
};

export default createRoomMiddleware;