import type { Consumer } from 'mediasoup-client/lib/Consumer';
import { AppThunk } from '../store';
import { roomActions } from '../slices/roomSlice';
import { Logger } from '../../utils/Logger';
import { createRecordingSink, RecordingSink, storageHeadroom } from '../../utils/recordingSink';
import { RecordingMimeType, resolveRecordingMimeType } from '../../utils/recordingMimeTypes';
import { notificationsActions } from '../slices/notificationsSlice';
import {
	localRecordingFailedLabel,
	localRecordingSaveFailedLabel,
	localRecordingSplitLabel,
	localRecordingUnsupportedLabel
} from '../../components/translated/translatedComponents';

const logger = new Logger('RecordingActions');

const RECORDING_SLICE_SIZE = 1000;
const RECORDING_BITRATE = 6000000;
const STORAGE_CHECK_INTERVAL = 15000;
const STORAGE_HEADROOM = 256 * 1024 * 1024;
const RECORDING_CONSTRAINTS = {
	video: {
		displaySurface: 'browser',
		width: { ideal: 1920 },
		height: { ideal: 1080 }
	},
	audio: false,
	selfBrowserSurface: 'include'
};

let sink: RecordingSink | undefined;
let recorder: MediaRecorder;
let screenStream: MediaStream;
let recorderStream: MediaStream;
let audioContext: AudioContext;
let audioDestination: MediaStreamAudioDestinationNode;
let recordingType: RecordingMimeType | undefined;
let baseName = 'recording';
let closing: Promise<void> | undefined;
let storageMonitor: number | undefined;
let rollingOver = false;
let detachListeners: Array<() => void> = [];

const recordingFilename = (): string => {
	const now = new Date();
	const pad = (value: number): string => String(value).padStart(2, '0');
	const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
		`_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

	return `${baseName}_${timestamp}.${recordingType?.extension}`;
};

const setBaseName = (roomName: string | null): void => {
	baseName = (roomName ?? 'recording').replace(/[\\/:*?"<>|]/g, '-');
};

const runDetachListeners = (): void => {
	detachListeners.forEach((detach) => detach());
	detachListeners = [];
};

const stopRecorder = (): Promise<void> => new Promise((resolve) => {
	if (!recorder || recorder.state === 'inactive') return resolve();

	recorder.addEventListener('stop', () => resolve(), { once: true });
	recorder.stop();
});

const isUserCancelled = (error: unknown): boolean =>
	error instanceof DOMException && (error.name === 'AbortError' || error.name === 'NotAllowedError');

const notifyError = (message: string): AppThunk<void> => (dispatch) => {
	dispatch(notificationsActions.enqueueNotification({
		message,
		options: { variant: 'error' }
	}));
};

const closeSink = (notify = true): AppThunk<void> => (dispatch) => {
	const current = sink;

	sink = undefined;

	if (!current) return;

	dispatch(roomActions.updateRoom({ savingRecording: true }));

	closing = current.close()
		.catch((error) => {
			logger.error('closeSink() [error:%o]', error);

			if (notify) dispatch(notifyError(localRecordingSaveFailedLabel()));
		})
		.finally(() => dispatch(roomActions.updateRoom({ savingRecording: false })));
};

const startSegment = (usePicker: boolean): AppThunk<Promise<void>> => async (dispatch) => {
	if (!recordingType) throw new Error('no recording mime type');

	sink = await createRecordingSink({
		filename: recordingFilename(),
		mimeType: recordingType.mimeType,
		extension: recordingType.extension,
		usePicker
	});

	recorder = new MediaRecorder(recorderStream, {
		mimeType: recordingType.mimeType,
		videoBitsPerSecond: RECORDING_BITRATE
	});

	recorder.addEventListener('error', (event) => {
		logger.error('recording.error', event);

		dispatch(notifyError(localRecordingFailedLabel()));
		dispatch(stopRecording());
	});

	recorder.addEventListener('dataavailable', (event) => {
		logger.debug('recording.dataavailable [data:%o]', event.data);

		if (event.data.size > 0) sink?.write(event.data);
	});

	recorder.addEventListener('stop', () => {
		logger.debug('recording.stop event');

		dispatch(closeSink());
	});

	recorder.start(RECORDING_SLICE_SIZE);
};

const rollOverRecording = (): AppThunk<Promise<void>> => async (dispatch) => {
	if (rollingOver || recorder?.state !== 'recording') return;

	rollingOver = true;

	logger.debug('rollOverRecording()');

	try {
		await stopRecorder();
		await closing;
		await dispatch(startSegment(false));

		dispatch(notificationsActions.enqueueNotification({
			message: localRecordingSplitLabel(),
			options: { variant: 'warning' }
		}));
	} catch (error) {
		logger.error('rollOverRecording() [error:%o]', error);

		dispatch(notifyError(localRecordingFailedLabel()));
		dispatch(stopRecording());
	} finally {
		rollingOver = false;
	}
};

const stopStorageMonitor = (): void => {
	if (storageMonitor !== undefined) window.clearInterval(storageMonitor);

	storageMonitor = undefined;
};

const startStorageMonitor = (): AppThunk<void> => (dispatch) => {
	stopStorageMonitor();

	storageMonitor = window.setInterval(() => {
		storageHeadroom()
			.then((headroom) => {
				if (headroom === undefined || headroom > STORAGE_HEADROOM) return;

				logger.warn('startStorageMonitor() [headroom:%s]', headroom);

				return dispatch(rollOverRecording());
			})
			.catch((error) => logger.error('startStorageMonitor() [error:%o]', error));
	}, STORAGE_CHECK_INTERVAL);
};

export const startRecording = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, signalingService }
) => {
	const { manualRecordingMimeType, preferredRecorderMimeType } = getState().settings;
	const recordingMimeType = resolveRecordingMimeType(
		manualRecordingMimeType ? preferredRecorderMimeType : undefined
	);

	logger.debug('recordingActions.start [mimeType:%s]', recordingMimeType?.mimeType);

	if (!recordingMimeType) {
		dispatch(notifyError(localRecordingUnsupportedLabel()));

		return logger.error('Recording is not supported');
	}

	recordingType = recordingMimeType;

	setBaseName(new URL(getState().signaling.url).searchParams.get('roomId'));

	try {
		audioContext = new AudioContext();
		audioDestination = audioContext.createMediaStreamDestination();
		audioContext.createGain().connect(audioDestination);

		if (mediaService.mediaSenders['mic'].track) {
			audioContext.createMediaStreamSource(
				new MediaStream([ mediaService.mediaSenders['mic'].track ])
			).connect(audioDestination);
		}

		if (mediaService.mediaSenders['screenaudio'].track) {
			audioContext.createMediaStreamSource(
				new MediaStream([ mediaService.mediaSenders['screenaudio'].track ])
			).connect(audioDestination);
		}

		for (const device of [ 'mic', 'screenaudio' ] as const) {
			const sender = mediaService.mediaSenders[device];
			const onStarted = (): void => {
				if (sender.track) {
					audioContext.createMediaStreamSource(
						new MediaStream([ sender.track ])
					).connect(audioDestination);
				}
			};

			sender.on('started', onStarted);
			detachListeners.push(() => sender.off('started', onStarted));
		}

		const onConsumerCreated = (consumer: Consumer): void => {
			if (consumer.kind === 'audio') {
				logger.debug('consumerCreated event');

				audioContext.createMediaStreamSource(
					new MediaStream([ consumer.track ])
				).connect(audioDestination);
			}
		};

		mediaService.on('consumerCreated', onConsumerCreated);
		detachListeners.push(() => mediaService.off('consumerCreated', onConsumerCreated));

		const audioConsumers = mediaService.getConsumers().filter((consumer) => consumer.kind === 'audio');

		for (const consumer of audioConsumers) {
			logger.debug('audioConsumer [consumer:%o]', consumer);

			audioContext.createMediaStreamSource(
				new MediaStream([ consumer.track ])
			).connect(audioDestination);
		}

		screenStream = await navigator.mediaDevices.getDisplayMedia(RECORDING_CONSTRAINTS);

		const [ screenVideotrack ] = screenStream.getVideoTracks();
		const [ mixedAudioTrack ] = audioDestination.stream.getTracks();

		screenVideotrack.addEventListener('ended', () => {
			logger.debug('screenVideotrack ended event');

			dispatch(stopRecording());
		});

		recorderStream = new MediaStream([ mixedAudioTrack, screenVideotrack ]);

		await dispatch(startSegment(true));

		signalingService.notify('recording', { recording: true });

		dispatch(startStorageMonitor());
		dispatch(roomActions.updateRoom({ recording: true }));
	} catch (error) {
		logger.error('recordingActions.start [error:%o]', error);

		if (!isUserCancelled(error)) dispatch(notifyError(localRecordingFailedLabel()));

		runDetachListeners();
		screenStream?.getTracks().forEach((track) => track.stop());
		audioContext?.close();
		dispatch(closeSink(false));
	}
};

export const stopRecording = (immediate = false): AppThunk<void> => (
	dispatch,
	_getState,
	{ signalingService }
) => {
	logger.debug('stopRecording() [immediate:%s]', immediate);

	signalingService.notify('recording', { recording: false });

	const running = recorder?.state === 'recording' || recorder?.state === 'paused';

	stopStorageMonitor();
	runDetachListeners();

	try {
		if (running) recorder.stop();

		screenStream?.getTracks().forEach((track) => track.stop());
		recorderStream?.getTracks().forEach((track) => track.stop());
		audioContext?.close();
		audioDestination?.disconnect();
	} catch (error) {
		logger.error('stopRecording() [error:%o]', error);
	}

	if (!running || immediate) dispatch(closeSink());

	dispatch(roomActions.updateRoom({ recording: false }));
};
