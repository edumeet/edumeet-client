import { Logger } from '../../utils/logger';
import { chatActions } from '../slices/chatSlice';
import { filesharingActions } from '../slices/filesharingSlice';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { meActions } from '../slices/meSlice';
import { peersActions } from '../slices/peersSlice';
import { permissionsActions } from '../slices/permissionsSlice';
import { roomActions } from '../slices/roomSlice';
import { webrtcActions } from '../slices/webrtcSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { updateMic, updateWebcam } from './mediaActions';

const logger = new Logger('LocaleActions');

// This action is triggered when the server sends "roomReady" to us.
// This means that we start our joining process which is:
// 1. Create our Mediasoup transports
// 2. Discover our capabilities
// 3. Signal the server that we are ready
// 4. Update the state
export const joinRoom = () => async (
	dispatch: AppDispatch,
	getState: RootState,
	{
		signalingService,
		mediaService,
		performanceMonitor
	}: MiddlewareOptions
): Promise<void> => {
	logger.debug('joinRoom()');

	const iceServers = getState().webrtc.iceServers;

	performanceMonitor.on('performance', (performance) => {
		logger.debug('"performance" event [trend:%s, performance:%s]', performance.trend, performance.performance);
	});

	const {
		recvTransport,
	} = await mediaService.createTransports(iceServers);

	if (recvTransport)
		performanceMonitor.monitorTransport(recvTransport);

	dispatch(meActions.setMediaCapabilities(
		mediaService.mediaCapabilities
	));

	const rtpCapabilities = mediaService.rtpCapabilities;
	const { displayName } = getState().settings;
	const { id: meId, picture } = getState().me;
	const { loggedIn } = getState().permissions;

	const {
		authenticated,
		roles,
		peers,
		tracker,
		roomPermissions,
		userRoles,
		allowWhenRoleMissing,
		chatHistory,
		fileHistory,
		lastNHistory,
		locked,
		lobbyPeers,
		roomMode,
	} = await signalingService.sendRequest('join', {
		displayName,
		picture,
		rtpCapabilities,
		returning: false, // TODO: fix reconnect
	});

	for (const peer of peers) {
		dispatch(peersActions.addPeer(peer));
	}

	dispatch(roomActions.setRoomMode('P2P'));
	dispatch(chatActions.addMessages(chatHistory));
	dispatch(filesharingActions.addFiles(fileHistory));
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
		dispatch(updateMic({ start: true }));
	if (!videoMuted)
		dispatch(updateWebcam({ init: true, start: true }));
};