import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { peersActions } from '../slices/peersSlice';
import { LobbyPeer, lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { setRaisedHand } from '../actions/meActions';
import { Logger } from 'edumeet-common';
import { startExtraVideo, stopMic, stopScreenSharing, stopWebcam, updateMic, updateScreenSharing, updateWebcam } from '../actions/mediaActions';

const logger = new Logger('PeerMiddleware');

const createPeerMiddleware = ({
	signalingService,
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
									raisedHandTimestamp
								} = notification.data;

								dispatch(peersActions.addPeer({
									id,
									sessionId,
									displayName,
									picture,
									raisedHand,
									raisedHandTimestamp,
									transcripts: [],
								}));

								if (getState().me.micEnabled) dispatch(updateMic({ enable: false }));
								if (getState().me.webcamEnabled) dispatch(updateWebcam({ enable: false }));
								if (getState().me.screenEnabled) dispatch(updateScreenSharing({ enable: false }));
								if (getState().me.extraVideoEnabled) dispatch(startExtraVideo({ enable: false }));

								break;
							}

							case 'peerClosed': {
								const { peerId } = notification.data;

								dispatch(peersActions.removePeer({ id: peerId }));

								if (getState().me.micEnabled) dispatch(updateMic({ enable: false }));
								if (getState().me.webcamEnabled) dispatch(updateWebcam({ enable: false }));
								if (getState().me.screenEnabled) dispatch(updateScreenSharing({ enable: false }));
								if (getState().me.extraVideoEnabled) dispatch(startExtraVideo({ enable: false }));

								break;
							}

							case 'changeSessionId': {
								const { peerId, sessionId, oldSessionId } = notification.data;

								dispatch(peersActions.setPeerSessionId({ id: peerId, sessionId, oldSessionId }));

								break;
							}

							case 'changeDisplayName':
							case 'changePicture':
							case 'raisedHand': {
								const {
									peerId,
									displayName,
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

			return next(action);
		};

	return middleware;
};

export default createPeerMiddleware;
