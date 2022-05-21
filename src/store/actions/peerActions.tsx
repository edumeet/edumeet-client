import { Logger } from '../../utils/logger';
import { peersActions } from '../slices/peersSlice';
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