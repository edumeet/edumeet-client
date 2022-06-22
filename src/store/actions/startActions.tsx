import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { Logger } from '../../utils/logger';
import { meActions } from '../slices/meSlice';
import { DevicesUpdated } from '../../services/deviceService';
import {
	makePermissionSelector,
	micProducerSelector,
	webcamProducerSelector
} from '../selectors';
import { permissions } from '../../utils/roles';
import { updateMic, updateWebcam } from './mediaActions';
import { producersActions } from '../slices/producersSlice';
import { notificationsActions } from '../slices/notificationsSlice';
import { uiActions } from '../slices/uiSlice';
import { lock, unlock } from './permissionsActions';
import { drawerActions } from '../slices/drawerSlice';
import { devicesChangedLabel } from '../../components/translated/translatedComponents';
import { permissionsActions } from '../slices/permissionsSlice';
import { settingsActions } from '../slices/settingsSlice';

const logger = new Logger('listenerActions');

export const startListeners = () => (
	dispatch: AppDispatch,
	getState: RootState,
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

		if (newDevices.length || removedDevices.length) {
			dispatch(notificationsActions.enqueueNotification({
				message: devicesChangedLabel()
			}));
		}
	});

	navigator.mediaDevices.addEventListener('devicechange', async () => {
		logger.debug('devicechange');

		await deviceService.updateMediaDevices();
	});

	const audioPermissionSelector = makePermissionSelector(permissions.SHARE_AUDIO);
	const videoPermissionSelector = makePermissionSelector(permissions.SHARE_VIDEO);

	document.addEventListener('keydown', ({ repeat, target, key }): void => {
		if (repeat) return;

		const source = target as HTMLElement;

		if (
			[ 'input', 'textarea', 'div' ]
				.includes(source?.tagName?.toLowerCase())
		)
			return;

		logger.debug('[key:%s]', key);

		switch (key) {
			case 'm': {
				const audioInProgress = getState().me.audioInProgress;

				if (audioInProgress) return;

				const hasAudioPermission = audioPermissionSelector(getState());
				const canSendMic = getState().me.canSendMic;

				if (!hasAudioPermission || !canSendMic) return;

				const micProducer = micProducerSelector(getState());

				if (!micProducer) {
					dispatch(updateMic({
						start: true
					}));
				} else if (!micProducer.paused) {
					dispatch(
						producersActions.setProducerPaused({
							producerId: micProducer.id,
							local: true,
							source: 'mic'
						})
					);
				} else {
					dispatch(
						producersActions.setProducerResumed({
							producerId: micProducer.id,
							local: true,
							source: 'mic'
						})
					);
				}

				break;
			}

			case 'v': {
				const videoInProgress = getState().me.videoInProgress;

				if (videoInProgress) return;

				const hasVideoPermission = videoPermissionSelector(getState());
				const canSendWebcam = getState().me.canSendWebcam;

				if (!hasVideoPermission || !canSendWebcam) return;

				const webcamProducer = webcamProducerSelector(getState());

				if (!webcamProducer) {
					dispatch(updateWebcam({
						start: true
					}));
				} else {
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

			case 's': {
				const settingsOpen = getState().ui.settingsOpen;

				dispatch(uiActions.setUi({ settingsOpen: !settingsOpen }));

				break;
			}

			case 'd': {
				const filesharingOpen = getState().ui.filesharingOpen;

				dispatch(uiActions.setUi({ filesharingOpen: !filesharingOpen }));

				break;
			}

			case 'l': {
				const lockInProgress = getState().room.lockInProgress;

				if (lockInProgress) return;

				const locked = getState().permissions.locked;

				if (locked) {
					dispatch(unlock());
				} else {
					dispatch(lock());
				}

				break;
			}

			case 'p': {
				dispatch(drawerActions.toggle());
				dispatch(drawerActions.setTab('users'));

				break;
			}

			case 'c': {
				dispatch(drawerActions.toggle());
				dispatch(drawerActions.setTab('chat'));

				break;
			}
		}
	});

	window.addEventListener('message', ({ data }: MessageEvent) => {
		if (data.type === 'edumeet-login') {
			const { data: {
				displayName,
				picture,
			} } = data;

			displayName && dispatch(settingsActions.setDisplayName(displayName));
			picture && dispatch(meActions.setPicture(picture));
			dispatch(permissionsActions.setLoggedIn(true));
		} else if (data.type === 'edumeet-logout')
			dispatch(permissionsActions.setLoggedIn(false));
	});
};