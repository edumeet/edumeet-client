import { Middleware } from '@reduxjs/toolkit';
import { roomActions } from '../slices/roomSlice';
import { signalingActions } from '../slices/signalingSlice';
import { Logger } from '../../utils/logger';
import { MiddlewareOptions } from '../store';
import { webrtcActions } from '../slices/webrtcSlice';
import { permissionsActions } from '../slices/permissionsSlice';
import { peersActions } from '../slices/peersSlice';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { deviceActions } from '../slices/deviceSlice';

const logger = new Logger('RoomMiddleware');

const createRoomMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
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
								dispatch(roomActions.updateRoom({ inLobby: false, joined: true }));
								dispatch(deviceActions.setKeyListener({ keyListener: true }));
								dispatch( // TODO: this needs an enumerateDevices or similar first
									deviceActions.setMediaDeviceListener({ mediaDeviceListener: true }));

								break;
							}

							case 'enteredLobby': {
								dispatch(roomActions.updateRoom({ inLobby: true }));

								// TODO: send displayname and picture
								break;
							}

							case 'overRoomLimit': {
								dispatch(roomActions.updateRoom({ overRoomLimit: true }));

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
				const { loggedIn } = getState().permissions;

				const {
					authenticated, // boolean
					roles, // [ roleId, roleId, ... ]
					peers, // { peerId: Peer, ... }
					tracker, // string
					roomPermissions, // { permissionId: [ role, role, ... ], ... }
					userRoles, // { roleName: { id: number, label: string, ... }, ... }
					allowWhenRoleMissing, // [ permissionId, ... ]
					// chatHistory, // [ message, ... ]
					// fileHistory, // [ file, ... ]
					// lastNHistory, // [ peerId, ... ]
					locked, // boolean
					lobbyPeers, // { peerId: LobbyPeer, ... }
				} = await signalingService.sendRequest('join', {
					displayName,
					picture,
					rtpCapabilities,
					returning: false, // TODO: fix reconnect
				});

				for (const peer of peers) {
					dispatch(peersActions.addPeer(peer));
				}

				dispatch(lobbyPeersActions.addPeers(lobbyPeers));
				dispatch(permissionsActions.setRoomPermissions({ roomPermissions }));
				dispatch(permissionsActions.setUserRoles({ userRoles }));
				allowWhenRoleMissing && dispatch(
					permissionsActions.setAllowWhenRoleMissing({ allowWhenRoleMissing })
				);
				dispatch(permissionsActions.addRoles({ roles }));
				dispatch(webrtcActions.setTracker({ tracker }));
				if (loggedIn !== authenticated)
					dispatch(
						permissionsActions.setLoggedIn({ loggedIn: authenticated, local: true })
					);
				dispatch(permissionsActions.setLocked({ locked: Boolean(locked), local: true }));
			}

			// TODO: reconnect states here

			return next(action);
		};

	return middleware;
};

export default createRoomMiddleware;