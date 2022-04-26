import { Middleware } from '@reduxjs/toolkit';
import WebTorrent from 'webtorrent';
import { Logger } from '../../utils/logger';
import { chatActions } from '../slices/chatSlice';
import { roomActions } from '../slices/roomSlice';
import { signalingActions } from '../slices/signalingSlice';
import { webrtcActions } from '../slices/webrtcSlice';
import { MiddlewareOptions } from '../store';

const logger = new Logger('SharingMiddleware');

const createSharingMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createSharingMiddleware()');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let webTorrent: any;

	const middleware: Middleware = ({ dispatch, getState }) =>
		(next) => (action) => {
			if (signalingActions.connected.match(action)) {
				signalingService.on('notification', (notification) => {
					logger.debug(
						'signalingService "notification" event [method:%s, data:%o]',
						notification.method, notification.data);

					try {
						switch (notification.method) {
							case 'chatMessage': {
								const { chatMessage } = notification.data;

								dispatch(chatActions.addMessage(chatMessage));
								break;
							}
						}
					} catch (error) {
						logger.error('error on signalService "notification" event [error:%o]', error);
					}
				});
			}

			if (roomActions.updateRoom.match(action) && action.payload.joined) {
				if (WebTorrent.WEBRTC_SUPPORT) {
					dispatch(webrtcActions.setTorrentSupport(true));

					const iceServers = getState().room.iceServers;

					webTorrent = new WebTorrent({
						tracker: {
							rtcConfig: {
								iceServers: iceServers
							}
						},
					});

					webTorrent.on('error', (error: Error) => {
						logger.warn('WebTorrent [error:%o]', error);
					});
				}
			}

			return next(action);
		};
	
	return middleware;
};

export default createSharingMiddleware;