import { Logger } from 'edumeet-common';
import { batch } from 'react-redux';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { meActions } from '../slices/meSlice';
import { peersActions } from '../slices/peersSlice';
import { permissionsActions } from '../slices/permissionsSlice';
import { roomActions } from '../slices/roomSlice';
import { signalingActions } from '../slices/signalingSlice';
import { webrtcActions } from '../slices/webrtcSlice';
import { AppThunk } from '../store';
import { stopPreviewMic, stopPreviewWebcam, updateLiveMic, updateLiveWebcam } from './mediaActions';
import { initialRoomSession, roomSessionsActions } from '../slices/roomSessionsSlice';
import { getSignalingUrl } from '../../utils/signalingHelpers';
import { getTenantFromFqdn } from './managementActions';
import { mediaActions } from '../slices/mediaSlice';
import { notificationsActions } from '../slices/notificationsSlice';
import { errorJoiningRoomLabel } from '../../components/translated/translatedComponents';

const logger = new Logger('RoomActions');

export const connect = (roomId: string): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
): Promise<void> => {
	logger.debug('connect()');

	dispatch(roomActions.updateRoom({ joinInProgress: true }));

	try {
		const encodedRoomId = encodeURIComponent(roomId);
		const peerId = getState().me.id;
		const token = getState().permissions.token;
		const tenantId = await dispatch(getTenantFromFqdn(location.hostname));

		if (!tenantId) throw new Error('connect() | no tenantId found');

		const url = getSignalingUrl(peerId, encodedRoomId, tenantId, token);
	
		dispatch(signalingActions.setUrl(url));
		dispatch(signalingActions.connect());
	} catch (error) {
		logger.error('connect() [error:"%o"]', error);
		dispatch(notificationsActions.enqueueNotification({
			message: errorJoiningRoomLabel(),
			options: { variant: 'error' }
		}));

	} finally {
		dispatch(roomActions.updateRoom({ joinInProgress: false }));
	}
};

// This action is triggered when the server sends "roomReady" to us.
// This means that we start our joining process which is:
// 1. Create our Mediasoup transports
// 2. Discover our capabilities
// 3. Signal the server that we are ready
// 4. Update the state
export const joinRoom = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService, mediaService /* , performanceMonitor */ }
): Promise<void> => {
	logger.debug('joinRoom()');

	const {
		iceServers,
		rtcStatsOptions,
	} = getState().webrtc;

	mediaService.rtcStatsInit(rtcStatsOptions);

	/* performanceMonitor.on('performance', (performance) => {
		logger.debug('"performance" event [trend:%s, performance:%s]', performance.trend, performance.performance);
	}); */

	await mediaService.createTransports(iceServers);

	dispatch(meActions.setMediaCapabilities(
		mediaService.mediaCapabilities
	));

	const rtpCapabilities = mediaService.rtpCapabilities;
	const { displayName } = getState().settings;
	const { sessionId, picture } = getState().me;

	const {
		peers,
		tracker,
		chatHistory,
		fileHistory,
		breakoutRooms,
		locked,
		lobbyPeers,
		roomMode = 'SFU',
	} = await signalingService.sendRequest('join', {
		displayName,
		picture,
		rtpCapabilities,
	});

	batch(() => {
		dispatch(roomActions.setMode(roomMode));
		dispatch(permissionsActions.setLocked(Boolean(locked)));
		dispatch(roomSessionsActions.addRoomSessions(breakoutRooms));
		dispatch(peersActions.addPeers(peers));
		dispatch(lobbyPeersActions.addPeers(lobbyPeers));
		dispatch(roomSessionsActions.addMessages({ sessionId, messages: chatHistory }));
		dispatch(roomSessionsActions.addFiles({ sessionId, files: fileHistory }));
		dispatch(webrtcActions.setTracker(tracker));

		const { videoMuted, audioMuted, previewVideoDeviceId, previewAudioInputDeviceId, previewBlurBackground, previewAudioOutputDeviceId } = getState().media;
		const { canSelectAudioOutput } = getState().me;

		dispatch(mediaActions.setLiveBlurBackground(previewBlurBackground));
		
		if (canSelectAudioOutput && previewAudioOutputDeviceId)
			dispatch(mediaActions.setLiveAudioOutputDeviceId(previewAudioOutputDeviceId));

		if (!audioMuted && previewAudioInputDeviceId) {
			dispatch(mediaActions.setLiveAudioInputDeviceId(previewAudioInputDeviceId));
			dispatch(updateLiveMic());
		}
		if (!videoMuted && previewVideoDeviceId) {
			dispatch(mediaActions.setLiveVideoDeviceId(previewVideoDeviceId));
			dispatch(updateLiveWebcam());
		}

		dispatch(stopPreviewMic());
		dispatch(stopPreviewWebcam());
	});

	/* const rtcStatsMetaData = { 
		applicationName: 'edumeet', // mandatoy
		confName, // mandatory
		confID: window.location.toString(),
		meetingUniqueId: sessionId,
		endpointId: meId,
		deviceId: meId,
		displayName,
	};

	mediaService.rtcStatsIdentity(rtcStatsMetaData); */
};

export const leaveRoom = (): AppThunk<Promise<void>> => async (
	dispatch
): Promise<void> => {
	logger.debug('leaveRoom()');

	dispatch(signalingActions.disconnect());
};

export const createBreakoutRoom = (name: string): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('createBreakoutRoom()');

	dispatch(roomActions.updateRoom({ updateBreakoutInProgress: true }));

	try {
		const { sessionId, creationTimestamp } = await signalingService.sendRequest('createBreakoutRoom', { name });

		dispatch(roomSessionsActions.addRoomSession({ sessionId, name, creationTimestamp, ...initialRoomSession }));
	} catch (error) {
		logger.error('createBreakoutRoom() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ updateBreakoutInProgress: false }));
	}
};

export const ejectBreakoutRoom = (sessionId: string): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('ejectBreakoutRoom()');

	dispatch(roomActions.updateRoom({ updateBreakoutInProgress: true }));

	try {
		await signalingService.sendRequest('ejectBreakoutRoom', { roomSessionId: sessionId });
	} catch (error) {
		logger.error('ejectBreakoutRoom() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ updateBreakoutInProgress: false }));
	}
};

export const removeBreakoutRoom = (sessionId: string): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('removeBreakoutRoom()');

	dispatch(roomActions.updateRoom({ updateBreakoutInProgress: true }));

	try {
		await signalingService.sendRequest('removeBreakoutRoom', { roomSessionId: sessionId });

		dispatch(roomSessionsActions.removeRoomSession(sessionId));
	} catch (error) {
		logger.error('removeBreakoutRoom() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ updateBreakoutInProgress: false }));
	}
};

export const joinBreakoutRoom = (sessionId: string): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('joinBreakoutRoom()');

	dispatch(roomActions.updateRoom({ transitBreakoutRoomInProgress: true }));
	const audioEnabled = getState().media.liveAudioInputDeviceId && !getState().media.audioMuted;
	const videoEnabled = getState().media.liveVideoDeviceId && !getState().media.videoMuted;

	try {
		const {
			chatHistory,
			fileHistory,
		} = await signalingService.sendRequest('joinBreakoutRoom', { roomSessionId: sessionId });

		batch(() => {
			dispatch(meActions.setSessionId(sessionId));
			dispatch(roomSessionsActions.addMessages({ sessionId, messages: chatHistory }));
			dispatch(roomSessionsActions.addFiles({ sessionId, files: fileHistory }));
			audioEnabled && dispatch(updateLiveMic());
			videoEnabled && dispatch(updateLiveWebcam());
		});
	} catch (error) {
		logger.error('joinBreakoutRoom() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ transitBreakoutRoomInProgress: false }));
	}
};

export const leaveBreakoutRoom = (): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('leaveBreakoutRoom()');

	dispatch(roomActions.updateRoom({ transitBreakoutRoomInProgress: true }));

	try {
		const {
			sessionId,
		} = await signalingService.sendRequest('leaveBreakoutRoom');

		dispatch(meActions.setSessionId(sessionId));
	} catch (error) {
		logger.error('leaveBreakoutRoom() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ transitBreakoutRoomInProgress: false }));
	}
};

export const closeMeeting = (): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('closeMeeting()');

	dispatch(roomActions.updateRoom({ closeMeetingInProgress: true }));

	try {
		await signalingService.sendRequest('moderator:closeMeeting');
	} catch (error) {
		logger.error('closeMeeting() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ closeMeetingInProgress: false }));
	}
};