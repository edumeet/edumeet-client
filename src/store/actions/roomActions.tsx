import { batch } from 'react-redux';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { meActions } from '../slices/meSlice';
import { peersActions } from '../slices/peersSlice';
import { permissionsActions } from '../slices/permissionsSlice';
import { roomActions } from '../slices/roomSlice';
import { drawingActions } from '../slices/drawingSlice';
import { signalingActions } from '../slices/signalingSlice';
import { AppThunk, fileService } from '../store';
import { updateMic, updateWebcam } from './mediaActions';
import { initialRoomSession, roomSessionsActions } from '../slices/roomSessionsSlice';
import { getSignalingUrl } from '../../utils/signalingHelpers';
import { getTenantFromFqdn } from './managementActions';
import { Logger } from '../../utils/Logger';
import { stopListeners } from './startActions';

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
		const tenantId = await dispatch(getTenantFromFqdn(window.location.hostname));

		const url = getSignalingUrl(peerId, encodedRoomId, tenantId, token);
	
		dispatch(signalingActions.setUrl(url));
		dispatch(signalingActions.connect());
	} catch (error) {
		logger.error('connect() [error:"%o"]', error);
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

	dispatch(meActions.setLocalCapabilities(mediaService.localCapabilities));

	const displayName = getState().settings.displayName;
	const { sessionId, picture } = getState().me;

	const {
		peers,
		tracker,
		maxFileSize,
		chatHistory,
		fileHistory,
		countdownTimer,
		drawing,
		breakoutRooms,
		locked,
		lobbyPeers,
	} = await signalingService.sendRequest('join', {
		displayName,
		picture,
	});

	fileService.tracker = tracker;
	if (maxFileSize)
		fileService.maxFileSize = maxFileSize;
	
	// this does nothing 
	// fileService.iceServers = mediaService.iceServers; 

	batch(() => {
		
		dispatch(permissionsActions.setLocked(Boolean(locked)));
		dispatch(roomSessionsActions.addRoomSessions(breakoutRooms));
		dispatch(peersActions.addPeers(peers));
		dispatch(lobbyPeersActions.addPeers(lobbyPeers));
		dispatch(roomSessionsActions.addMessages({ sessionId, messages: chatHistory }));
		dispatch(roomSessionsActions.addFiles({ sessionId, files: fileHistory }));
		dispatch(roomActions.joinCountdownTimer(countdownTimer));

		dispatch(countdownTimer.isStarted ? 
			roomActions.startCountdownTimer() : 
			roomActions.stopCountdownTimer()
		);

		dispatch(drawing.isEnabled ? 
			drawingActions.enableDrawing() : 
			drawingActions.disableDrawing()
		);

		dispatch(drawingActions.setDrawingBgColor(drawing.bgColor));
		dispatch(drawingActions.InitiateCanvas(drawing.canvasState));
	});
	
	if (!getState().me.audioMuted) dispatch(updateMic());
	if (!getState().me.videoMuted) dispatch(updateWebcam());
};

export const leaveRoom = (): AppThunk<Promise<void>> => async (
	dispatch
): Promise<void> => {
	logger.debug('leaveRoom()');
	dispatch(stopListeners());
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

	try {
		const audioMuted = getState().me.audioMuted;
		const videoMuted = getState().me.videoMuted;

		logger.debug('joinBreakoutRoom:', audioMuted, videoMuted);

		const {
			chatHistory,
			fileHistory,
		} = await signalingService.sendRequest('joinBreakoutRoom', { roomSessionId: sessionId });

		batch(() => {
			dispatch(meActions.setSessionId(sessionId));
			dispatch(roomSessionsActions.addMessages({ sessionId, messages: chatHistory }));
			dispatch(roomSessionsActions.addFiles({ sessionId, files: fileHistory }));
		});

		if (!audioMuted) dispatch(updateMic());
		if (!videoMuted) dispatch(updateWebcam());
	} catch (error) {
		logger.error('joinBreakoutRoom() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ transitBreakoutRoomInProgress: false }));
	}
};

export const leaveBreakoutRoom = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('leaveBreakoutRoom()');

	dispatch(roomActions.updateRoom({ transitBreakoutRoomInProgress: true }));

	try {
		const audioMuted = getState().me.audioMuted;
		const videoMuted = getState().me.videoMuted;

		const {
			sessionId,
			chatHistory,
			fileHistory
		} = await signalingService.sendRequest('leaveBreakoutRoom');

		batch(() => {
			dispatch(meActions.setSessionId(sessionId));

			if (chatHistory)
				dispatch(roomSessionsActions.addMessages({ sessionId, messages: chatHistory }));

			if (fileHistory)
				dispatch(roomSessionsActions.addFiles({ sessionId, files: fileHistory }));
		});

		if (!audioMuted) dispatch(updateMic());
		if (!videoMuted) dispatch(updateWebcam());
	} catch (error) {
		logger.error('leaveBreakoutRoom() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ transitBreakoutRoomInProgress: false }));
	}
};

export const moveToBreakoutRoom = (peerId: string, sessionId: string): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('moveToBreakoutRoom()');

	dispatch(roomActions.updateRoom({ transitBreakoutRoomInProgress: true }));

	try {
		await signalingService.sendRequest('moveToBreakoutRoom', { roomSessionId: sessionId, roomPeerId: peerId });
	} catch (error) {
		logger.error('moveToBreakoutRoom() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ transitBreakoutRoomInProgress: false }));
	}
};

export const closeMeeting = (): AppThunk<void> => (
	_dispatch,
	_getState,
	{ signalingService }
) => {
	logger.debug('closeMeeting()');

	signalingService.notify('moderator:closeMeeting');
};
