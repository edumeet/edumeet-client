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
import { meActions } from '../slices/meSlice';
import { initialRoomSession, roomSessionsActions } from '../slices/roomSessionsSlice';
import { settingsActions } from '../slices/settingsSlice';

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
			if (signalingActions.connect.match(action)) {
				signalingService.on('notification', (notification) => {
					try {
						switch (notification.method) {
							case 'roomReady': {
								const {
									sessionId,
									creationTimestamp,
									turnServers,
									rtcStatsOptions,
									clientMonitorSenderConfig,
									maxActiveVideos,
									breakoutsEnabled,
									chatEnabled,
									filesharingEnabled,
									raiseHandEnabled,
									localRecordingEnabled,
									settings,
									// TODO: get the rest of the data from the server
								} = notification.data;

								batch(() => {
									dispatch(roomSessionsActions.addRoomSession({
										sessionId,
										creationTimestamp,
										parent: true,
										...initialRoomSession,
									}));
									dispatch(meActions.setSessionId(sessionId));
									dispatch(webrtcActions.setIceServers(turnServers));
									dispatch(webrtcActions.setRTCStatsOptions(rtcStatsOptions));
									dispatch(settingsActions.setMaxActiveVideos(maxActiveVideos));
									dispatch(roomActions.updateRoom({
										logo: settings.logo,
										backgroundImage: settings.background,
										breakoutsEnabled,
										chatEnabled,
										filesharingEnabled,
										raiseHandEnabled,
										localRecordingEnabled,
										videoCodec: settings.videoCodec ?? 'vp8',
										simulcast: settings.simulcast ?? true,
										audioCodec: settings.audioCodec ?? 'opus',
										screenSharingCodec: settings.screenSharingCodec ?? 'vp8',
										screenSharingSimulcast: settings.screenSharingSimulcast ?? true,
									}));

									dispatch(roomActions.setState('joined'));
									dispatch(joinRoom());
								});

								if (clientMonitorSenderConfig) {
									mediaService.getMonitor()?.setRoomId(sessionId);
									mediaService.getMonitor()?.connect(clientMonitorSenderConfig);
								}

								break;
							}

							case 'roomUpdate': {
								const {
									locked,
									chatEnabled,
									filesharingEnabled,
									raiseHandEnabled,
									localRecordingEnabled,
									breakoutsEnabled,
									maxActiveVideos,
									settings,
								} = notification.data;

								batch(() => {
									dispatch(roomActions.updateRoom({
										chatEnabled,
										filesharingEnabled,
										raiseHandEnabled,
										localRecordingEnabled,
										breakoutsEnabled,
										logo: settings.logo,
										backgroundImage: settings.background,
										videoCodec: settings.videoCodec ?? 'vp8',
										simulcast: settings.simulcast ?? true,
										audioCodec: settings.audioCodec ?? 'opus',
										screenSharingCodec: settings.screenSharingCodec ?? 'vp8',
										screenSharingSimulcast: settings.screenSharingSimulcast ?? true,
									}));
									dispatch(permissionsActions.setLocked(locked));
									dispatch(settingsActions.setMaxActiveVideos(maxActiveVideos));
								});

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

							case 'activeSpeaker': {
								const { peerId, sessionId } = notification.data;
								const { id, sessionId: mySessionId } = getState().me;

								if (sessionId !== mySessionId) break;
								const isMe = peerId === id;

								dispatch(roomSessionsActions.setActiveSpeakerId({ sessionId, peerId, isMe }));
								break;
							} 

							case 'moderator:kick':
							case 'escapeMeeting': {
								dispatch(leaveRoom());

								break;
							}

							case 'newBreakoutRoom': {
								const { name, roomSessionId, creationTimestamp } = notification.data;

								dispatch(roomSessionsActions.addRoomSession({ name, sessionId: roomSessionId, creationTimestamp, ...initialRoomSession }));

								break;
							}

							case 'breakoutRoomClosed': {
								const { roomSessionId } = notification.data;

								dispatch(roomSessionsActions.removeRoomSession(roomSessionId));

								break;
							}

							case 'sessionIdChanged': {
								const { sessionId } = notification.data;

								dispatch(meActions.setSessionId(sessionId));

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