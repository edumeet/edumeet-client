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
				dispatch(roomActions.setRoomState('connecting'));
			}

			if (signalingActions.disconnected.match(action)) {
				// TODO: close session
			}

			if (signalingActions.connected.match(action)) {
				dispatch(roomActions.setRoomState('connected'));

				signalingService.on('notification', (notification) => {
					logger.debug(
						'signalingService "notification" event [method:%s, data:%o]',
						notification.method, notification.data);

					try {
						switch (notification.method) {
							case 'roomReady': {
								const { turnServers } = notification.data;

								dispatch(webrtcActions.setIceServers(turnServers));
								dispatch(roomActions.updateRoom({ inLobby: false, joined: true }));
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

			// We can't join until we have rtpCapabilities
			if (webrtcActions.setRtpCapabilities.match(action)) {
				const rtpCapabilities = action.payload;
				const { displayName } = getState().settings;
				const { id: meId, picture } = getState().me;
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
					lastNHistory, // [ peerId, ... ]
					locked, // boolean
					lobbyPeers, // [ LobbyPeer, ... ]
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
				dispatch(permissionsActions.setRoomPermissions(roomPermissions));
				dispatch(permissionsActions.setUserRoles(userRoles));
				allowWhenRoleMissing && dispatch(
					permissionsActions.setAllowWhenRoleMissing(allowWhenRoleMissing)
				);

				const spotlights = lastNHistory.filter((peerId: string) => peerId !== meId);

				dispatch(roomActions.addSpotlightList(spotlights));
				dispatch(permissionsActions.addRoles(roles));
				dispatch(webrtcActions.setTracker(tracker));
				if (loggedIn !== authenticated)
					dispatch(permissionsActions.setLoggedIn(authenticated));
				dispatch(permissionsActions.setLocked(Boolean(locked)));

				const { audioMuted, videoMuted } = getState().settings;

				if (!audioMuted)
					dispatch(deviceActions.updateMic({ start: true }));
				if (!videoMuted)
					dispatch(deviceActions.updateWebcam({ init: true, start: true }));
			}

			// TODO: reconnect states here

			return next(action);
		};

	return middleware;
};

export default createRoomMiddleware;