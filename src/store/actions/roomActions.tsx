import { Logger } from 'edumeet-common';
import { batch } from 'react-redux';
import { chatActions } from '../slices/chatSlice';
import { filesharingActions } from '../slices/filesharingSlice';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { meActions } from '../slices/meSlice';
import { Peer, peersActions } from '../slices/peersSlice';
import { permissionsActions } from '../slices/permissionsSlice';
import { roomActions } from '../slices/roomSlice';
import { signalingActions } from '../slices/signalingSlice';
import { webrtcActions } from '../slices/webrtcSlice';
import { AppThunk } from '../store';
import { updateMic, updateWebcam } from './mediaActions';
import { breakoutRoomsActions } from '../slices/breakoutRoomsSlice';

const logger = new Logger('RoomActions');

// This action is triggered when the server sends "roomReady" to us.
// This means that we start our joining process which is:
// 1. Create our Mediasoup transports
// 2. Discover our capabilities
// 3. Signal the server that we are ready
// 4. Update the state
export const joinRoom = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService, mediaService, performanceMonitor }
): Promise<void> => {
	logger.debug('joinRoom()');

	const {
		iceServers,
		rtcStatsOptions,
	} = getState().webrtc;

	mediaService.rtcStatsInit(rtcStatsOptions);

	performanceMonitor.on('performance', (performance) => {
		logger.debug('"performance" event [trend:%s, performance:%s]', performance.trend, performance.performance);
	});

	await mediaService.createTransports(iceServers);

	// if (recvTransport)
	//	performanceMonitor.monitorTransport(recvTransport);

	dispatch(meActions.setMediaCapabilities(
		mediaService.mediaCapabilities
	));

	const rtpCapabilities = mediaService.rtpCapabilities;
	const { displayName, audioOnly } = getState().settings;
	const { /* id: meId,*/ picture } = getState().me;
	const { loggedIn } = getState().permissions;
	// const { name: confName, sessionId } = getState().room;

	const {
		authenticated,
		peers,
		tracker,
		chatHistory,
		fileHistory,
		locked,
		lobbyPeers,
		roomMode = 'SFU',
	} = await signalingService.sendRequest('join', {
		displayName,
		picture,
		audioOnly,
		rtpCapabilities,
		returning: false, // TODO: fix reconnect
	});

	const spotlights = peers.map((p: Peer) => p.id);

	batch(() => {
		dispatch(roomActions.setMode(roomMode));
		dispatch(permissionsActions.setLocked(Boolean(locked)));

		if (loggedIn !== authenticated)
			dispatch(permissionsActions.setLoggedIn(Boolean(authenticated)));

		dispatch(peersActions.addPeers(peers));
		dispatch(lobbyPeersActions.addPeers(lobbyPeers));
		dispatch(chatActions.addMessages(chatHistory));
		dispatch(filesharingActions.addFiles(fileHistory));
		dispatch(roomActions.addSpotlightList(spotlights));
		dispatch(webrtcActions.setTracker(tracker));

		const { audioMuted, videoMuted } = getState().settings;

		if (!audioMuted)
			dispatch(updateMic({ start: true }));
		if (!videoMuted)
			dispatch(updateWebcam({ start: true }));
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
		const { sessionId } = await signalingService.sendRequest('createBreakoutRoom', { name });

		dispatch(breakoutRoomsActions.addBreakoutRoom({ sessionId, name }));
	} catch (error) {
		logger.error('createBreakoutRoom() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ updateBreakoutInProgress: false }));
	}
};

export const closeBreakoutRoom = (sessionId: string): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('closeBreakoutRoom()');

	dispatch(roomActions.updateRoom({ updateBreakoutInProgress: true }));

	try {
		await signalingService.sendRequest('closeBreakoutRoom', { sessionId });

		dispatch(breakoutRoomsActions.removeBreakoutRoom({ sessionId }));
	} catch (error) {
		logger.error('closeBreakoutRoom() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ updateBreakoutInProgress: false }));
	}
};

export const joinBreakoutRoom = (sessionId: string): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('joinBreakoutRoom()');

	dispatch(roomActions.updateRoom({ transitBreakoutRoomInProgress: true }));

	try {
		const {
			chatHistory,
			fileHistory,
		} = await signalingService.sendRequest('joinBreakoutRoom', { sessionId });

		batch(() => {
			dispatch(roomActions.setSessionId(sessionId));
			dispatch(chatActions.addMessages(chatHistory));
			dispatch(filesharingActions.addFiles(fileHistory));
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