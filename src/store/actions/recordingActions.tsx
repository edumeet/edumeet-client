import { Logger } from 'edumeet-common';
import { AppThunk } from '../store';
import { recordingActions } from '../slices/recordingSlice';

const logger = new Logger('RecordingActions');

const RECORDING_SLICE_SIZE = 1000;
const RECORDING_CONSTRAINTS = {
	videoBitsPerSecond: 8000000,
	video: {
		displaySurface: 'browser',
		width: { ideal: 1920 }
	},
	audio: false,
	advanced: [
		{ width: 1920, height: 1080 },
		{ width: 1280, height: 720 }
	],
	selfBrowserSurface: 'include'
};

let writableStream: FileSystemWritableFileStream;
let recorder: MediaRecorder;
let screenStream: MediaStream;
let recorderStream: MediaStream;
let audioContext: AudioContext;
let audioDestination: MediaStreamAudioDestinationNode;
let mimeType: string;

const stopRecorder = async () => {
	logger.debug('stopRecorder()');

	try {
		recorder?.stop();
		screenStream?.getTracks().forEach((track) => track.stop());
		recorderStream?.getTracks().forEach((track) => track.stop());
		audioContext?.close();
		audioDestination?.disconnect();

		// Give some time for last recording chunks to come through
		setTimeout(async () => {
			try {
				await writableStream?.close();
			} catch (error) {
				logger.error('stopRecorder() [error:%o]', error);
			}
		}, RECORDING_SLICE_SIZE);
	} catch (error) {
		logger.error('stopRecorder() [error:%o]', error);
	}
};

export const startRecording = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService }
) => {
	mimeType = getState().settings.preferredRecorderMimeType;

	logger.debug('recordingActions.start [mimeType:%s]', mimeType);

	if (!MediaRecorder || !window.showSaveFilePicker)
		return logger.error('Recording is not supported');

	const roomName = new URL(getState().signaling.url).searchParams.get('roomId');

	const opts:SaveFilePickerOptions = {
		suggestedName: `${roomName}.mp4`,
		types: [
			{
				description: 'LocalRecording',
				accept: { 'video/mp4': [ '.mp4' ] },
			},
		],
	};

	const saveFileHandle = await showSaveFilePicker(opts);

	writableStream = await saveFileHandle.createWritable();

	try {
		audioContext = new AudioContext();
		audioDestination = audioContext.createMediaStreamDestination();
		audioContext.createGain().connect(audioDestination);

		if (mediaService.tracks['mic']) {
			audioContext.createMediaStreamSource(
				new MediaStream([ mediaService.tracks['mic'] ])
			).connect(audioDestination);
		}

		if (mediaService.tracks['screenaudio']) {
			audioContext.createMediaStreamSource(
				new MediaStream([ mediaService.tracks['screenaudio'] ])
			).connect(audioDestination);
		}

		const audioConsumers = mediaService.getConsumers()
			.filter((consumer) => consumer.appData.source === 'mic');

		for (const consumer of audioConsumers) {
			if (consumer.track) {
				audioContext.createMediaStreamSource(
					new MediaStream([ consumer.track ])
				).connect(audioDestination);
			}
		}

		mediaService.on('consumerCreated', (consumer) => {
			if (consumer.appData.source === 'mic' && consumer.track) {
				audioContext.createMediaStreamSource(
					new MediaStream([ consumer.track ])
				).connect(audioDestination);
			}
		});

		const [ mixedAudioTrack ] = audioDestination.stream.getTracks();

		screenStream = await navigator.mediaDevices.getDisplayMedia(
			RECORDING_CONSTRAINTS
		);

		const [ screenVideotrack ] = screenStream.getVideoTracks();

		screenVideotrack.addEventListener('ended', () => {
			logger.debug('screenVideotrack ended event');

			dispatch(stopRecording());
		});

		recorderStream = new MediaStream([ mixedAudioTrack, screenVideotrack ]);
		recorder = new MediaRecorder(recorderStream, { mimeType });

		recorder.addEventListener('error', (event) => {
			logger.error('recording.error', event);

			dispatch(stopRecording());
		});

		recorder.addEventListener('dataavailable', async (event) => {
			logger.debug('recording.dataavailable [data:%o]', event.data);

			if (event.data.size > 0) {
				try {
					await writableStream.write(event.data);
				} catch (error) {
					logger.error('recording.dataavailable [error:%o]', error);
				}
			}
		});

		recorder.start(RECORDING_SLICE_SIZE);

		dispatch(recordingActions.start());
	} catch (error) {
		logger.error('recordingActions.start [error:%o]', error);
	}
};

export const stopRecording = (): AppThunk<Promise<void>> => async (dispatch) => {
	logger.debug('stopRecording()');

	await stopRecorder();

	dispatch(recordingActions.stop());
};
