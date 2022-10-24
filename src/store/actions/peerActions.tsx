import { Logger } from '../../utils/logger';
import { peersActions } from '../slices/peersSlice';
import { roomActions } from '../slices/roomSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';

const logger = new Logger('PeerActions');

export const lowerPeerHand = (id: string) => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('lowerPeerHand() [id:"%s"]', id);

	dispatch(peersActions.updatePeer({ id, raisedHandInProgress: true }));

	try {
		await signalingService.sendRequest('moderator:lowerHand', { peerId: id });
	} catch (error) {
		logger.error('lowerPeerHand() [error:"%o"]', error);
	} finally {
		dispatch(peersActions.updatePeer({ id, raisedHandInProgress: false }));
	}
};

export const kickPeer = (id: string) => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('kickPeer() [id:"%s"]', id);

	dispatch(peersActions.updatePeer({ id, kickInProgress: true }));

	try {
		await signalingService.sendRequest('moderator:kickPeer', { peerId: id });
	} catch (error) {
		logger.error('kickPeer() [error:"%o"]', error);
	} finally {
		dispatch(peersActions.updatePeer({ id, kickInProgress: false }));
	}
};

export const stopAudio = (id: string) => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('stopAudio() [id:"%s"]', id);

	dispatch(peersActions.updatePeer({ id, stopAudioInProgress: true }));

	try {
		await signalingService.sendRequest('moderator:mute', { peerId: id });
	} catch (error) {
		logger.error('stopAudio() [error:"%o"]', error);
	} finally {
		dispatch(peersActions.updatePeer({ id, stopAudioInProgress: false }));
	}
};

export const stopVideo = (id: string) => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('stopVideo() [id:"%s"]', id);

	dispatch(peersActions.updatePeer({ id, stopVideoInProgress: true }));

	try {
		await signalingService.sendRequest('moderator:stopVideo', { peerId: id });
	} catch (error) {
		logger.error('stopVideo() [error:"%o"]', error);
	} finally {
		dispatch(peersActions.updatePeer({ id, stopVideoInProgress: false }));
	}
};

export const stopScreenSharing = (id: string) => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('stopScreenSharing() [id:"%s"]', id);

	dispatch(peersActions.updatePeer({ id, stopScreenSharingInProgress: true }));

	try {
		await signalingService.sendRequest('moderator:stopScreenSharing', { peerId: id });
	} catch (error) {
		logger.error('stopScreenSharing() [error:"%o"]', error);
	} finally {
		dispatch(peersActions.updatePeer({ id, stopScreenSharingInProgress: false }));
	}
};

export const muteAll = () => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('muteAllPeers()');

	dispatch(roomActions.updateRoom({ muteAllInProgress: true }));

	try {
		await signalingService.sendRequest('moderator:muteAll');
	} catch (error) {
		logger.error('muteAllPeers() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ muteAllInProgress: false }));
	}
};

export const stopAllVideo = () => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('stopAllPeerVideos()');

	dispatch(roomActions.updateRoom({ muteAllInProgress: true }));

	try {
		await signalingService.sendRequest('moderator:stopAllVideo');
	} catch (error) {
		logger.error('stopAllPeerVideos() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ muteAllInProgress: false }));
	}
};

export const stopAllScreenshare = () => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('stopAllScreenshare()');

	dispatch(roomActions.updateRoom({ muteAllInProgress: true }));

	try {
		await signalingService.sendRequest('moderator:stopAllScreenSharing');
	} catch (error) {
		logger.error('stopAllScreenshare() [error:%o]', error);
	} finally {
		dispatch(roomActions.updateRoom({ muteAllInProgress: false }));
	}
};