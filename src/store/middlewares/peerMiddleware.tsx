import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { Logger } from '../../utils/logger';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { peersActions } from '../slices/peersSlice';
import { LobbyPeer, lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { setRaisedHand } from '../actions/meActions';
import { micProducerSelector, screenProducerSelector, webcamProducerSelector } from '../selectors';
import { producersActions } from '../slices/producersSlice';

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
		getState: () => RootState
	}) =>
		(next) => (action) => {
			if (signalingActions.connect.match(action)) {
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

							case 'moderator:lowerHand': {
								dispatch(setRaisedHand(false));

								break;
							}

							case 'moderator:mute': {
								const micProducer = micProducerSelector(getState());

								if (micProducer && !micProducer.paused) {
									dispatch(
										producersActions.setProducerPaused({
											producerId: micProducer.id,
											local: true,
											source: 'mic'
										})
									);
								}

								break;
							}

							case 'moderator:stopVideo': {
								const webcamProducer = webcamProducerSelector(getState());

								if (webcamProducer) {
									dispatch(
										producersActions.closeProducer({
											producerId: webcamProducer.id,
											local: true,
											source: 'webcam'
										})
									);
								}

								break;
							}

							case 'moderator:stopScreenSharing': {
								const screenProducer = screenProducerSelector(getState());

								if (screenProducer) {
									dispatch(
										producersActions.closeProducer({
											producerId: screenProducer.id,
											local: true,
											source: 'screen'
										})
									);
								}

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