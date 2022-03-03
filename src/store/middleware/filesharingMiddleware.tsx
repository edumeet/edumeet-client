import { Middleware } from '@reduxjs/toolkit';
import WebTorrent from 'webtorrent';
import { Logger } from '../../utils/logger';
import { roomActions } from '../slices/roomSlice';
import { webrtcActions } from '../slices/webrtcSlice';
import { MiddlewareOptions } from '../store';

const logger = new Logger('FilesharingMiddleware');

const createFilesharingMiddleware = ({ signalingService }: MiddlewareOptions) => {
	logger.debug('createFilesharingMiddleware()');

	let webTorrent: any;

	const middleware: Middleware = ({ dispatch, getState }) =>
		(next) => (action) => {
			if (WebTorrent.WEBRTC_SUPPORT) {
				if (roomActions.joined.match(action)) {
					dispatch(webrtcActions.setTorrentSupport({ torrentSupport: true }));

					const turnServers = getState().room.turnServers;

					webTorrent = new WebTorrent({
						tracker: {
							rtcConfig: {
								iceServers: turnServers
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

export default createFilesharingMiddleware;