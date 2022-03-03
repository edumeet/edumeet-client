import { Middleware } from '@reduxjs/toolkit';
import { roomActions } from '../slices/roomSlice';
import { signalingActions } from '../slices/signalingSlice';
import { Logger } from '../../utils/logger';
import { MiddlewareOptions } from '../store';
import { webrtcActions } from '../slices/webrtcSlice';
import { permissionsActions } from '../slices/permissionsSlice';

const logger = new Logger('RoomMiddleware');

const createRoomMiddleware = ({ signalingService }: MiddlewareOptions) => {
	logger.debug('createRoomMiddleware()');

	const middleware: Middleware = ({ dispatch, getState }) =>
		(next) => async (action) => {
			if (signalingActions.connect.match(action)) {
				dispatch(roomActions.setRoomState({ state: 'connecting' }));
			}

			if (signalingActions.disconnected.match(action)) {
				// TODO: close session
			}

			if (signalingActions.connected.match(action)) {
				dispatch(roomActions.setRoomState({ state: 'connected' }));

				signalingService.on('notification', (notification) => {
					logger.debug(
						'signalingService "notification" event [method:%s, data:%o]',
						notification.method, notification.data);

					try {
						switch (notification.method) {
							case 'roomReady': {
								const { turnServers } = notification.data;

								dispatch(webrtcActions.setTurnServers({ turnServers }));
								dispatch(roomActions.setInLobby({ inLobby: false }));
								dispatch(roomActions.joined());

								break;
							}

							case 'enteredLobby': {
								dispatch(roomActions.setInLobby({ inLobby: true }));

								// TODO: send displayname and picture
								break;
							}

							case 'overRoomLimit': {
								dispatch(roomActions.setOverRoomLimit({ overRoomLimit: true }));

								break;
							}

							case 'roomBack': {
								break;
							}

							case 'activeSpeaker': {
								break;
							}
						}
					} catch (error) {
						logger.error('error on signalService "notification" event [error:%o]', error);
					}
				});
			}

			// We can't join until we have rtpCapabilities
			if (webrtcActions.setRtpCapabilities.match(action)) {
				const { rtpCapabilities } = action.payload;
				const { displayName } = getState().settings;
				const { picture } = getState().me;

				const {
					authenticated,
					roles,
					peers,
					tracker,
					roomPermissions,
					// userRoles,
					allowWhenRoleMissing,
					chatHistory,
					fileHistory,
					lastNHistory,
					locked,
					lobbyPeers,
					accessCode
				} = await signalingService.sendRequest('join', {
					displayName,
					picture,
					rtpCapabilities,
					returning: false, // TODO: fix reconnect
				});

				dispatch(webrtcActions.setTracker({ tracker }));
				dispatch(permissionsActions.setLoggedIn({ loggedIn: authenticated }));
				dispatch(permissionsActions.setRoomPermissions({ roomPermissions }));

				allowWhenRoleMissing && dispatch(
					permissionsActions.setAllowWhenRoleMissing({ allowWhenRoleMissing })
				);
			}

			// TODO: reconnect states here

			return next(action);
		};

	return middleware;
};

export default createRoomMiddleware;