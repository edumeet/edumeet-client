import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { Logger } from '../../utils/logger';
import { MiddlewareOptions } from '../store';
import { lobbyActions, LobbyPeer } from '../slices/lobbySlice';

const logger = new Logger('LobbyMiddleware');

const createLobbyMiddleware = ({ signalingService }: MiddlewareOptions) => {
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

								dispatch(lobbyActions.addPeer({ id: peerId }));

								break;
							}

							case 'parkedPeers': {
								const { lobbyPeers } = notification.data;

								lobbyPeers?.forEach((peer: LobbyPeer) => {
									dispatch(lobbyActions.addPeer({ ...peer }));
								});

								break;
							}

							case 'lobby:peerClosed': {
								const { peerId } = notification.data;

								dispatch(lobbyActions.removePeer({ id: peerId }));

								break;
							}

							case 'lobby:promotedPeer': {
								const { peerId } = notification.data;

								dispatch(lobbyActions.removePeer({ id: peerId }));

								break;
							}

							case 'lobby:changeDisplayName': {
								const { peerId, displayName } = notification.data;

								dispatch(lobbyActions.setDisplayName({ id: peerId, displayName }));

								break;
							}

							case 'lobby:changePicture': {
								const { peerId, picture } = notification.data;

								dispatch(lobbyActions.setPicture({ id: peerId, picture }));
		
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