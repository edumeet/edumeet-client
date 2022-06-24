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