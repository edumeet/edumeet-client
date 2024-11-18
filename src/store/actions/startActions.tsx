import { AppThunk } from '../store';
import { meActions } from '../slices/meSlice';
import { DevicesUpdated } from '../../services/deviceService';
import { activeSpeakerIdSelector, makePermissionSelector } from '../selectors';
import { permissions } from '../../utils/roles';
import { stopMic, stopWebcam, updateMic, updateWebcam } from './mediaActions';
import { uiActions } from '../slices/uiSlice';
import { lock, unlock } from './permissionsActions';
import { permissionsActions } from '../slices/permissionsSlice';
import { setRaisedHand } from './meActions';
import { VolumeWatcher } from '../../utils/volumeWatcher';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { Logger } from '../../utils/Logger';

const logger = new Logger('listenerActions');

// eslint-disable-next-line no-unused-vars
let keydownListener: (event: KeyboardEvent) => void;
// eslint-disable-next-line no-unused-vars
let keyupListener: (event: KeyboardEvent) => void;
// eslint-disable-next-line no-unused-vars
let messageListener: (event: MessageEvent) => void;
let deviceChangeListener: () => Promise<void>;
// eslint-disable-next-line no-unused-vars
let devicesUpdatedListener: (event: DevicesUpdated) => void;

let speakerDetectionInterval: NodeJS.Timeout | undefined;

export const startListeners = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, signalingService, deviceService, managementService }
): Promise<void> => {
	logger.debug('startListeners()');

	devicesUpdatedListener = ({
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

		/* if (newDevices.length || removedDevices.length) {
			dispatch(notificationsActions.enqueueNotification({
				message: devicesChangedLabel()
			}));
		} */
	};

	deviceService.on('devicesUpdated', devicesUpdatedListener);

	deviceChangeListener = async () => {
		logger.debug('devicechange');

		await deviceService.updateMediaDevices();
	};

	navigator.mediaDevices.addEventListener('devicechange', deviceChangeListener);

	speakerDetectionInterval = setInterval(() => {
		const audioConsumers = mediaService.getConsumers().filter((consumer) => consumer.kind === 'audio');

		if (!audioConsumers.length) return;

		const lastActiveSpeakerId = activeSpeakerIdSelector(getState());
		const { sessionId: mySessionId } = getState().me;

		const consumer = audioConsumers.reduce((a, e) => ((e.appData.volumeWatcher as VolumeWatcher).lastScaledVolume > (a.appData.volumeWatcher as VolumeWatcher).lastScaledVolume ? e : a));

		if ((consumer.appData.volumeWatcher as VolumeWatcher).lastScaledVolume > 0.5) { // > 5% volume
			const peerId = consumer.appData.peerId as string;

			if (peerId && peerId !== lastActiveSpeakerId) dispatch(roomSessionsActions.setActiveSpeakerId({ sessionId: mySessionId, peerId, isMe: false }));
		} else if (lastActiveSpeakerId) {
			dispatch(roomSessionsActions.setActiveSpeakerId({ sessionId: mySessionId, isMe: false }));
		}
	}, 500);

	const audioPermissionSelector = makePermissionSelector(permissions.SHARE_AUDIO);
	const videoPermissionSelector = makePermissionSelector(permissions.SHARE_VIDEO);
	const lockPermissionSelector = makePermissionSelector(permissions.CHANGE_ROOM_LOCK);

	keydownListener = ({ repeat, target, key, ctrlKey, altKey, shiftKey, metaKey }): void => {
		if (repeat) return;

		const source = target as HTMLElement;

		if ([ 'input', 'textarea', 'div' ].includes(source?.tagName?.toLowerCase())) return;

		if (ctrlKey || altKey || shiftKey || metaKey) return;

		logger.debug('[keydown:%s]', key);

		switch (key) {
			case 'm': {
				const audioInProgress = getState().me.audioInProgress;

				if (audioInProgress) return;

				const hasAudioPermission = audioPermissionSelector(getState());
				const canSendMic = getState().me.canSendMic;

				if (!hasAudioPermission || !canSendMic) return;

				if (getState().me.micEnabled) {
					dispatch(stopMic());
				} else {
					dispatch(updateMic());
				}

				break;
			}

			case 'v': {
				const videoInProgress = getState().me.videoInProgress;

				if (videoInProgress) return;

				const hasVideoPermission = videoPermissionSelector(getState());
				const canSendWebcam = getState().me.canSendWebcam;

				if (!hasVideoPermission || !canSendWebcam) return;

				if (getState().me.webcamEnabled) {
					dispatch(stopWebcam());
				} else {
					dispatch(updateWebcam());
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

				const hasLockPermission = lockPermissionSelector(getState());

				if (!hasLockPermission) return;

				const locked = getState().permissions.locked;

				locked ? dispatch(unlock()) : dispatch(lock());

				break;
			}

			case 'p': {
				const participantListOpen = getState().ui.participantListOpen;

				dispatch(uiActions.setUi({ participantListOpen: !participantListOpen }));

				break;
			}

			case 'c': {
				const chatOpen = getState().ui.chatOpen;

				dispatch(uiActions.setUi({ chatOpen: !chatOpen }));

				break;
			}

			case 'q': {
				const showStats = getState().ui.showStats;

				dispatch(uiActions.setUi({ showStats: !showStats }));
				
				break;
			}

			case 'r': {
				const raisedHandInProgress = getState().me.raisedHandInProgress;

				if (raisedHandInProgress) return;

				const raisedHand = getState().me.raisedHand;

				dispatch(setRaisedHand(!raisedHand));

				break;
			}

			case 'h': {
				const helpOpen = getState().ui.helpOpen;

				dispatch(uiActions.setUi({ helpOpen: !helpOpen }));

				break;
			}

			// case ' ': {
			// 	const audioInProgress = getState().me.audioInProgress;
			//
			// 	if (audioInProgress) return;
			//
			// 	const hasAudioPermission = audioPermissionSelector(getState());
			// 	const canSendMic = getState().me.canSendMic;
			//
			// 	if (!canSendMic || !hasAudioPermission) return;
			//
			// 	const micProducer = getState().producers.mic;
			//
			// 	if (!micProducer) {
			// 		dispatch(updateMic({ start: true }));
			// 	} else if (micProducer.paused) {
			// 		dispatch(producersActions.setProducerResumed({ source: 'mic', local: true }));
			// 	}
			//
			// 	break;
			// }

			default: {
				break;
			}
		}
	};

	document.addEventListener('keydown', keydownListener);

	keyupListener = ({ target, key, ctrlKey, altKey, shiftKey, metaKey }): void => {
		const source = target as HTMLElement;

		if (
			[ 'input', 'textarea', 'div' ]
				.includes(source?.tagName?.toLowerCase())
		)
			return;

		if (ctrlKey || altKey || shiftKey || metaKey) return;

		logger.debug('[keyup:%s]', key);

		switch (key) {
			// case ' ': {
			// 	const audioInProgress = getState().me.audioInProgress;
			//
			// 	if (audioInProgress) return;
			//
			// 	const hasAudioPermission = audioPermissionSelector(getState());
			// 	const canSendMic = getState().me.canSendMic;
			//
			// 	if (!canSendMic || !hasAudioPermission) return;
			//
			// 	const micProducer = getState().producers.mic;
			//
			// 	if (!micProducer) return;
			//
			// 	if (!micProducer.paused) {
			// 		dispatch(producersActions.setProducerPaused({ source: 'mic', local: true }));
			// 	}
			// 	break;
			// }

			default: {
				break;
			}
		}
	};

	document.addEventListener('keyup', keyupListener);

	messageListener = async ({ data }: MessageEvent) => {
		if (data.type === 'edumeet-login') {
			const { data: token } = data;

			await (await managementService).authentication.setAccessToken(token);

			dispatch(permissionsActions.setToken(token));
			dispatch(permissionsActions.setLoggedIn(true));

			if (getState().signaling.state === 'connected')
				await signalingService.sendRequest('updateToken', { token }).catch((e) => logger.error('updateToken request failed [error: %o]', e));
		}
	};

	window.addEventListener('message', messageListener);
};

export const stopListeners = (): AppThunk<Promise<void>> => async (
	_dispatch,
	_getState,
	{ deviceService }
): Promise<void> => {
	logger.debug('stopListeners()');

	deviceService.removeListener('devicesUpdated', devicesUpdatedListener);
	clearInterval(speakerDetectionInterval);
	navigator.mediaDevices.removeEventListener('devicechange', deviceChangeListener);
	document.removeEventListener('keydown', keydownListener);
	document.removeEventListener('keyup', keyupListener);
	window.removeEventListener('message', messageListener);
};
