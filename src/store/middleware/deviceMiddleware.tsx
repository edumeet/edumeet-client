import { Middleware } from '@reduxjs/toolkit';
import { Logger } from '../../utils/logger';
import { deviceActions } from '../slices/deviceSlice';
import { MiddlewareOptions } from '../store';

const logger = new Logger('FilesharingMiddleware');

// eslint-disable-next-line no-unused-vars
let keyEventListener: (event: KeyboardEvent) => void;
let mediaDeviceEventListener: () => void;

const createDeviceMiddleware = ({
	config
}: MiddlewareOptions): Middleware => {
	logger.debug('createDeviceMiddleware()');

	const middleware: Middleware = ({ dispatch, getState }) =>
		(next) => (action) => {
			if (deviceActions.setKeyListener.match(action)) {
				const { keyListener } = action.payload;

				if (keyListener) {
					keyEventListener = (event: KeyboardEvent): void => {
						if (event.repeat) return;

						const source = event.target as HTMLElement;

						if (
							[ 'input', 'textarea', 'div' ]
								.includes(source?.tagName?.toLowerCase())
						)
							return;

						const key = event.key;

						logger.debug('[key:%s]', key);

						switch (key) {
							case 'a': {
								break;
							}

							case 'm': {
								break;
							}

							case 'v': {
								break;
							}
						}
					};

					document.addEventListener('keydown', keyEventListener);
				} else {
					document.removeEventListener('keydown', keyEventListener);
				}
			}

			if (deviceActions.setMediaDeviceListener.match(action)) {
				const { mediaDeviceListener } = action.payload;

				if (mediaDeviceListener) {
					mediaDeviceEventListener = (): void => {
						logger.debug('mediaDeviceEventListener() devicechange');
					};

					navigator.mediaDevices.addEventListener('devicechange', mediaDeviceEventListener);
				} else {
					navigator.mediaDevices.removeEventListener('devicechange', mediaDeviceEventListener);
				}
			}

			return next(action);
		};
	
	return middleware;
};

export default createDeviceMiddleware;