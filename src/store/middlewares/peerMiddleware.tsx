import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { Logger } from '../../utils/logger';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { peersActions } from '../slices/peersSlice';
import { LobbyPeer, lobbyPeersActions } from '../slices/lobbyPeersSlice';

const logger = new Logger('PeerMiddleware');

const createPeerMiddleware = ({
	signalingService,
	mediaService
}: MiddlewareOptions): Middleware => {
	logger.debug('createPeerMiddleware()');

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: RootState
	}) =>
		(next) => (action) => {
			if (signalingActions.connected.match(action)) {
				signalingService.on('notification', (notification) => {
					try {
						switch (notification.method) {
							case 'newPeer': {
								const {
									id,
									displayName,
									picture,
									roles,
									raisedHand,
									raisedHandTimestamp,
								} = notification.data;

								dispatch(peersActions.addPeer({
									id,
									displayName,
									picture,
									roles,
									raisedHand,
									raisedHandTimestamp,
								}));

								break;
							}

							case 'peerClosed': {
								const { peerId } = notification.data;

								dispatch(peersActions.removePeer({ id: peerId }));
								break;
							}

							case 'changeDisplayName':
							case 'changePicture':
							case 'raisedHand': {
								const {
									peerId,
									displayName,
									// oldDisplayName,
									picture,
									raisedHand,
									raisedHandTimestamp
								} = notification.data;

								dispatch(
									peersActions.updatePeer({
										id: peerId,
										displayName,
										picture,
										raisedHand,
										raisedHandTimestamp
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
									lobbyPeersActions.updatePeer({ id: peerId, displayName, picture }));
		
								break;
							}
						}
					} catch (error) {
						logger.error('error on signalService "notification" event [error:%o]', error);
					}
				});
			}

			if (peersActions.addPeers.match(action)) {
				const clientId = getState().me.id;

				for (const peer of action.payload) {
					const { id } = peer;

					mediaService.addPeer(id, clientId);
				}
			}

			if (peersActions.addPeer.match(action)) {
				const { id } = action.payload;
				const clientId = getState().me.id;

				mediaService.addPeer(id, clientId);
			}

			if (peersActions.removePeer.match(action)) {
				const { id } = action.payload;

				mediaService.removePeer(id);
			}

			return next(action);
		};

	return middleware;
};

export default createPeerMiddleware;