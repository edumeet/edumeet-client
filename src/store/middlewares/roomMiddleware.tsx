import { Middleware } from '@reduxjs/toolkit';
import { roomActions } from '../slices/roomSlice';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { webrtcActions } from '../slices/webrtcSlice';
import { joinRoom, leaveRoom } from '../actions/roomActions';
import { batch } from 'react-redux';
import { setDisplayName, setPicture } from '../actions/meActions';
import { permissionsActions } from '../slices/permissionsSlice';
import { Logger } from 'edumeet-common';

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
		getState: () => RootState
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
								const {
									sessionId,
									creationTimestamp,
									roles,
									roomPermissions,
									userRoles,
									allowWhenRoleMissing,
									turnServers,
									rtcStatsOptions,
									clientMonitorSenderConfig,
								} = notification.data;

								batch(() => {
									dispatch(roomActions.setSessionId(sessionId));
									dispatch(roomActions.setCreationTimestamp(creationTimestamp));
									dispatch(permissionsActions.addRoles(roles));
									dispatch(permissionsActions.setRoomPermissions(roomPermissions));
									dispatch(permissionsActions.setUserRoles(userRoles));
									allowWhenRoleMissing && dispatch(
										permissionsActions.setAllowWhenRoleMissing(allowWhenRoleMissing)
									);
									dispatch(webrtcActions.setIceServers(turnServers));
									dispatch(webrtcActions.setRTCStatsOptions(rtcStatsOptions));
									dispatch(roomActions.setState('joined'));
									dispatch(joinRoom());
								});

								if (clientMonitorSenderConfig) {
									const roomId = getState().room.name;

									mediaService.getMonitor()?.setRoomId(roomId);
									mediaService.getMonitor()?.connect(clientMonitorSenderConfig);
								}
								break;
							}

							case 'enteredLobby': {
								batch(() => {
									dispatch(roomActions.setState('lobby'));
									dispatch(setDisplayName(getState().settings.displayName ?? 'Guest'));
									dispatch(setPicture(getState().me.picture ?? ''));
								});
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

							case 'moderator:kick':
							case 'escapeMeeting': {
								dispatch(leaveRoom());

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