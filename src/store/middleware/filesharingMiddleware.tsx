import { Middleware } from '@reduxjs/toolkit';
import WebTorrent from 'webtorrent';
import { Logger } from '../../utils/logger';
import { roomActions } from '../slices/roomSlice';
import { webrtcActions } from '../slices/webrtcSlice';

const logger = new Logger('FilesharingMiddleware');

const createFilesharingMiddleware = (): Middleware => {
	logger.debug('createFilesharingMiddleware()');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let webTorrent: any;

	const middleware: Middleware = ({ dispatch, getState }) =>
		(next) => (action) => {
			if (WebTorrent.WEBRTC_SUPPORT) {
				if (roomActions.updateRoom.match(action) && action.payload.joined) {
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

export default createFilesharingMiddleware;