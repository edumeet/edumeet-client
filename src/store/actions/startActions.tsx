import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { Logger } from '../../utils/logger';
import { meActions } from '../slices/meSlice';
import { DevicesUpdated } from '../../services/deviceService';

const logger = new Logger('listenerActions');

export const startListeners = () => (
	dispatch: AppDispatch,
	_getState: RootState,
	{ deviceService }: MiddlewareOptions
): void => {
	logger.debug('startListeners()');

	deviceService.on('devicesUpdated', ({
		devices,
		removedDevices,
		newDevices
	}: DevicesUpdated) => {
		logger.debug(
			'mediaDevicesUpdated() [devices:%o, removedDevices:%o, newDevices:%o]',
			devices,
			removedDevices,
			newDevices
		);

		// TODO: notify about removed or new devices

		dispatch(meActions.setDevices(devices));
	});

	navigator.mediaDevices.addEventListener('devicechange', async () => {
		logger.debug('devicechange');

		await deviceService.updateMediaDevices();
	});

	document.addEventListener('keydown', (event): void => {
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
	});
};