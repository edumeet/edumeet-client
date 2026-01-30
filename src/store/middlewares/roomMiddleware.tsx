import { Middleware } from '@reduxjs/toolkit';
import { roomActions } from '../slices/roomSlice';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { joinRoom, leaveRoom } from '../actions/roomActions';
import { batch } from 'react-redux';
import { setDisplayName, setPicture } from '../actions/meActions';
import { syncSignalingUrl } from '../actions/signalingUrlActions';
import { updateMic, updateWebcam } from '../actions/mediaActions';
import { permissionsActions } from '../slices/permissionsSlice';
import { meActions } from '../slices/meSlice';
import { initialRoomSession, roomSessionsActions } from '../slices/roomSessionsSlice';
import { settingsActions } from '../slices/settingsSlice';
import { Logger } from '../../utils/Logger';

const logger = new Logger('RoomMiddleware');

const createRoomMiddleware = ({
	signalingService,
}: MiddlewareOptions): Middleware => {
	logger.debug('createRoomMiddleware()');

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: () => RootState
	}) => (next) => (action) => {
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
								maxActiveVideos,
								breakoutsEnabled,
								chatEnabled,
								filesharingEnabled,
								raiseHandEnabled,
								reactionsEnabled,
								localRecordingEnabled,
								settings,
								// TODO: get the rest of the data from the server
							} = notification.data;

							batch(() => {
								dispatch(roomSessionsActions.clearRoomSessions());
								dispatch(roomSessionsActions.addRoomSession({
									sessionId,
									creationTimestamp,
									parent: true,
									...initialRoomSession,
								}));
								dispatch(meActions.setSessionId(sessionId));
								dispatch(settingsActions.setMaxActiveVideos(maxActiveVideos));
								dispatch(roomActions.updateRoom({
									breakoutsEnabled,
									chatEnabled,
									filesharingEnabled,
									raiseHandEnabled,
									reactionsEnabled,
									localRecordingEnabled,
									logo: settings.logo,
									backgroundImage: settings.background,
									videoCodec: settings.videoCodec ?? 'vp8',
									simulcast: settings.simulcast ?? true,
									audioCodec: settings.audioCodec ?? 'opus',
									screenSharingCodec: settings.screenSharingCodec ?? 'vp8',
									screenSharingSimulcast: settings.screenSharingSimulcast ?? true,
								}));

								dispatch(roomActions.setState('joined'));

								const state = getState();
								const isRejoin = state.room.state === 'joined';

								if (isRejoin) {
									dispatch(rejoinRoom());
								} else {
									dispatch(joinRoom());
								}
							});

							break;
						}

						case 'roomUpdate': {
							const {
								locked,
								chatEnabled,
								filesharingEnabled,
								raiseHandEnabled,
								reactionsEnabled,
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
									reactionsEnabled,
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
								dispatch(
									setDisplayName(getState().management.username || getState().settings.displayName || 'Guest')
								);
								dispatch(setPicture(getState().me.picture || ''));
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
							const {
								sessionId,
								chatHistory,
								fileHistory
							} = notification.data;

							batch(() => {
								dispatch(meActions.setSessionId(sessionId));

								if (chatHistory)
									dispatch(roomSessionsActions.addMessages({ sessionId, messages: chatHistory }));

								if (fileHistory)
									dispatch(roomSessionsActions.addFiles({ sessionId, files: fileHistory }));
							});

							const lostAudio = getState().me.lostAudio;
							const lostVideo = getState().me.lostVideo;

							if (lostAudio) {
								dispatch(meActions.setLostAudio(false));
								dispatch(updateMic());
							}

							if (lostVideo) {
								dispatch(meActions.setLostVideo(false));
								dispatch(updateWebcam());
							}

							break;
						}

						case 'reconnectKey': {
							const { reconnectKey } = notification.data;

							dispatch(meActions.setReconnectKey(reconnectKey));
							dispatch(syncSignalingUrl({ reconnectKey: reconnectKey ?? null }));

							break;
						}

					}
				} catch (error) {
					logger.error('error on signalService "notification" event [error:%o]', error);
				}
			});
		}

		return next(action);
	};

	return middleware;
};

export default createRoomMiddleware;
