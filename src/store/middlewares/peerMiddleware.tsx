import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { peersActions } from '../slices/peersSlice';
import { LobbyPeer, lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { setRaisedHand } from '../actions/meActions';
import { stopMic, stopScreenSharing, stopWebcam } from '../actions/mediaActions';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { p2pModeSelector } from '../selectors';
import { Logger } from '../../utils/Logger';

const logger = new Logger('PeerMiddleware');

const createPeerMiddleware = ({
	signalingService,
	mediaService,
}: MiddlewareOptions): Middleware => {
	logger.debug('createPeerMiddleware()');

	const middleware: Middleware = ({
		getState,
		dispatch
	}: {
		getState: () => RootState;
		dispatch: AppDispatch,
	}) =>
		(next) => (action) => {
			if (signalingActions.connect.match(action)) {
				signalingService.on('notification', (notification) => {
					try {
						switch (notification.method) {
							case 'newPeer': {
								const {
									id,
									sessionId,
									displayName,
									picture,
									raisedHand,
									raisedHandTimestamp,
									recording,
								} = notification.data;

								dispatch(peersActions.addPeer({
									id,
									sessionId,
									displayName,
									picture,
									raisedHand,
									raisedHandTimestamp,
									recording,
									transcripts: [],
								}));

								break;
							}

							case 'peerClosed': {
								const { peerId } = notification.data;

								dispatch(peersActions.removePeer({ id: peerId }));

								break;
							}

							case 'changeSessionId': {
								const { peerId, sessionId, oldSessionId } = notification.data;

								dispatch(peersActions.setPeerSessionId({ id: peerId, sessionId, oldSessionId }));

								break;
							}

							case 'changeDisplayName':
							case 'changePicture':
							case 'recording':
							case 'raisedHand': 
							case 'reaction': {
								const {
									peerId,
									displayName,
									picture,
									raisedHand,
									raisedHandTimestamp,
									reaction,
									reactionTimestamp,
									recording,
								} = notification.data;

								dispatch(
									peersActions.updatePeer({
										id: peerId,
										displayName,
										picture,
										raisedHand,
										raisedHandTimestamp,
										reaction,
										reactionTimestamp,
										recording,
									})
								);

								break;
							}

							case 'parkedPeer': {
								const { peerId } = notification.data;

								dispatch(lobbyPeersActions.addPeer({ id: peerId }));

								break;
							}

							case 'parkedPeers': {
								const { lobbyPeers } = notification.data;

								lobbyPeers?.forEach((peer: LobbyPeer) => {
									dispatch(lobbyPeersActions.addPeer({ ...peer }));
								});

								break;
							}

							case 'lobby:peerClosed': {
								const { peerId } = notification.data;

								dispatch(lobbyPeersActions.removePeer({ id: peerId }));

								break;
							}

							case 'lobby:promotedPeer': {
								const { peerId } = notification.data;

								dispatch(lobbyPeersActions.removePeer({ id: peerId }));

								break;
							}

							case 'lobby:changeDisplayName':
							case 'lobby:changePicture': {
								const { peerId, picture, displayName } = notification.data;

								dispatch(
									lobbyPeersActions.updatePeer({
										id: peerId,
										displayName,
										picture,
									}));
								
								break;
							}

							case 'moderator:lowerHand': {
								dispatch(setRaisedHand(false));

								break;
							}

							case 'moderator:mute': {
								dispatch(stopMic());
								
								break;
							}

							case 'moderator:stopVideo': {
								dispatch(stopWebcam());
								
								break;
							}

							case 'moderator:stopScreenSharing': {
								dispatch(stopScreenSharing());
								
								break;
							}
						}
					} catch (error) {
						logger.error('error on signalService "notification" event [error:%o]', error);
					}
				});
			}

			if (peersActions.addPeer.match(action)) {
				mediaService.addPeerId(action.payload.id);
			}

			if (peersActions.addPeers.match(action)) {
				action.payload.forEach((peer) => {
					mediaService.addPeerId(peer.id);
				});
			}

			if (peersActions.removePeer.match(action)) {
				mediaService.removePeerId(action.payload.id);
			}
			
			if (
				peersActions.addPeer.match(action) ||
				peersActions.addPeers.match(action) ||
				peersActions.removePeer.match(action) ||
				roomSessionsActions.addRoomSession.match(action) ||
				roomSessionsActions.removeRoomSession.match(action) ||
				roomSessionsActions.addRoomSessions.match(action)
			) {
				const oldP2pMode = p2pModeSelector(getState());

				next(action);

				const p2pMode = p2pModeSelector(getState());

				if (oldP2pMode !== p2pMode) {
					mediaService.setP2PMode(p2pMode);
				}

				return;
			}

			return next(action);
		};

	return middleware;
};

export default createPeerMiddleware;
