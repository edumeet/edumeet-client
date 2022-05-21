import { Middleware } from '@reduxjs/toolkit';
import { Logger } from '../../utils/logger';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { recordingActions } from '../slices/recordingSlice';
import { openDB, deleteDB } from 'idb';

const logger = new Logger('RecordingMiddleware');

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
	]
};

// 10 sec
const RECORDING_SLICE_SIZE = 10000;

const createRecordingMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createRecordingMiddleware()');

	let recorder: MediaRecorder | null;
	let screenStream: MediaStream | null;
	let recorderStream: MediaStream | null;
	let audioContext: AudioContext | null;
	let audioDestination: MediaStreamAudioDestinationNode | null;
	let idbDB: IDBDatabase | null;
	let idbName: string | null;
	let idbStoreName: string | null;
	let chunks: Blob[] = [];
	const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') ? 'video/webm; codecs=vp9' : 'video/webm';

	const clearRecorder = () => {
		if (recorder) {
			recorder.stop();
			recorder = null;
		}

		if (screenStream) {
			screenStream.getTracks().forEach((track) => track.stop());
			screenStream = null;
		}

		if (recorderStream) {
			recorderStream.getTracks().forEach((track) => track.stop());
			recorderStream = null;
		}

		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}

		if (audioDestination) {
			audioDestination.disconnect();
			audioDestination = null;
		}

		chunks = [];
	};

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: RootState
	}) =>
		(next) => async (action) => {
			/* if (recordingActions.start.match(action)) {
				logger.debug('recordingActions.start');

				if (typeof MediaRecorder === 'undefined') {
					logger.error('MediaRecorder is not supported');

					return;
				}

				try {
					audioContext = new AudioContext();
					audioDestination = audioContext.createMediaStreamDestination();

					const [ mixedAudioTrack ] = audioDestination.stream.getAudioTracks();
	
					screenStream = await navigator.mediaDevices.getDisplayMedia(
						RECORDING_CONSTRAINTS
					);
	
					const [ screenVideotrack ] = screenStream.getVideoTracks();
	
					screenVideotrack.addEventListener('ended', () => {
						logger.debug('recording.track.ended');
	
						dispatch(recordingActions.stop());
						clearRecorder();
					});

					recorderStream = new MediaStream([ screenVideotrack, mixedAudioTrack ]);

					recorder = new MediaRecorder(recorderStream, { mimeType });

					recorder.addEventListener('dataavailable', (event) => {
						chunks.push(event.data);
					});

					const dt = new Date();
					// TODO: maybe fix later
					const rdt = `${dt.getFullYear() }-${ (`0${ dt.getMonth()+1}`).slice(-2) }
					//-${ (`0${ dt.getDate()}`).slice(-2) }_${dt.getHours() }
					//_${(`0${ dt.getMinutes()}`).slice(-2) }_${dt.getSeconds()}`;
					const ext = mimeType.split(';')[0].split('/')[1];
					const fileName = `${getState().room.name}-recording-${rdt}.${ext}`;
					let logToIDB = true;

					if (typeof indexedDB === 'undefined' || typeof indexedDB.open === 'undefined') {
						logger.warn('indexedDB is not supported');

						logToIDB = false;
					} else {
						idbName = Date.now().toString();
						idbDB = await openDB(idbName, 1, {
							upgrade(db) {
								db.createObjectStore('chunks');
							}
						});
					}

					recorder.addEventListener('stop', () => {
						logger.debug('recording.stop');
					});

					recorder.addEventListener('error', (event) => {
						logger.error('recording.error', event);
						
						dispatch(recordingActions.stop());
						clearRecorder();
					});

					recorder.addEventListener('dataavailable', (event) => {
						logger.debug('recording.dataavailable');

						if (logToIDB) {
							await idbDB?.put(idbStoreName, event.data, Date.now());
						}
					});
				} catch (error) {
					logger.error('recordingActions.start [error:%o]', error);
				}
			} */

			return next(action);
		};
	
	return middleware;
};

export default createRecordingMiddleware;