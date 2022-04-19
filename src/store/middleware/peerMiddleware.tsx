import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { Logger } from '../../utils/logger';
import { MiddlewareOptions } from '../store';
import { peersActions } from '../slices/peersSlice';

const logger = new Logger('PeerMiddleware');

const createPeerMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createPeerMiddleware()');

	const middleware: Middleware = ({ dispatch }) =>
		(next) => (action) => {
			if (signalingActions.connected.match(action)) {
				signalingService.on('notification', (notification) => {
					logger.debug(
						'signalingService "notification" event [method:%s, data:%o]',
						notification.method, notification.data);

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

export default createPeerMiddleware;