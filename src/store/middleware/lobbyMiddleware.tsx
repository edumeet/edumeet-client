import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { Logger } from '../../utils/logger';
import { MiddlewareOptions } from '../store';
import { lobbyPeersActions, LobbyPeer } from '../slices/lobbyPeersSlice';

const logger = new Logger('LobbyMiddleware');

const createLobbyMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createLobbyMiddleware()');

	const middleware: Middleware = ({ dispatch, getState }) =>
		(next) => (action) => {
			if (signalingActions.connected.match(action)) {
				signalingService.on('notification', (notification) => {
					logger.debug(
						'signalingService "notification" event [method:%s, data:%o]',
						notification.method, notification.data);

					try {
						switch (notification.method) {
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

			return next(action);
		};

	return middleware;
};

export default createLobbyMiddleware;