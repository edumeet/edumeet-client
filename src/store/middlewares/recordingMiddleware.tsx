/* eslint-disable max-len */
import { Middleware } from '@reduxjs/toolkit';
import { Logger } from '../../utils/logger';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { recordingActions } from '../slices/recordingSlice';
import { openDB, deleteDB, IDBPDatabase } from 'idb';
import streamsaver from 'streamsaver';

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
	// eslint-disable-next-line
	signalingService,
	// eslint-disable-next-line
	mediaService,
}: MiddlewareOptions): Middleware => {
	logger.debug('createRecordingMiddleware()');

	let recorder: MediaRecorder;
	let screenStream: MediaStream;
	let recorderStream: MediaStream;
	let audioContext: AudioContext;
	let audioDestination: MediaStreamAudioDestinationNode;
	let idbDB: IDBPDatabase;
	let idbName: string;
	const idbStoreName = 'chunks';
	const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') ? 'video/webm; codecs=vp9' : 'video/webm';

	const clearRecorder = () => {
		logger.debug('clearRecorder()');

		recorder?.stop();
		screenStream?.getTracks().forEach((track) => track.stop());
		recorderStream?.getTracks().forEach((track) => track.stop());
		audioContext?.close();
		audioDestination?.disconnect();
	};

	const saveRecordingWithStreamSaver = (
		keys: IDBValidKey[],
		writer: WritableStreamDefaultWriter,
		stop = false,
		db: IDBPDatabase,
		dbName: string,
	) => {
		logger.debug('saveRecordingWithStreamSaver()');

		let readableStream: ReadableStream;
		let reader: ReadableStreamDefaultReader;
		let pump: (() => void) | null = null;
		const key = keys[0];

		// on the first call we stop the streams (tab/screen sharing) 
		if (stop) {
			// Stop all used video/audio tracks
			recorderStream?.getTracks().forEach((track) => track.stop());
			screenStream?.getTracks().forEach((track) => track.stop());
		}

		keys.shift();
		db.get(idbStoreName, key).then((blob) => {
			if (keys.length === 0) {
				// if this is the last key we close the writable stream and cleanup the indexedDB
				readableStream = blob.stream();
				reader = readableStream.getReader();
				pump = () => reader.read().then((res) => (
					res.done
						? saveRecordingCleanup(db, dbName, writer)
						: writer.write(res.value).then(pump)));
				pump();
			} else {
				// push data to the writable stream
				readableStream = blob.stream();
				reader = readableStream.getReader();
				pump = () => reader.read().then((res) => (
					res.done
						? saveRecordingWithStreamSaver(keys, writer, false, db, dbName)
						: writer.write(res.value).then(pump)));
				pump();
			}
		});
	};

	const saveRecordingCleanup = (
		db: IDBPDatabase,
		dbName: string,
		writer?: WritableStreamDefaultWriter
	) => {
		logger.debug('saveRecordingCleanup()');

		writer?.close();
		db.close();
		deleteDB(dbName);

		indexedDB.databases().then((r) => r.forEach((dbdata) => dbdata.name && deleteDB(dbdata.name)));

		clearRecorder();
	};

	const middleware: Middleware = ({
		// eslint-disable-next-line
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: RootState
	}) =>
		(next) => async (action) => {
			if (recordingActions.start.match(action)) {
				logger.debug('recordingActions.start');

				if (!MediaRecorder)
					return logger.error('Recording is not supported');

				try {
					audioContext = new AudioContext();
					audioDestination = audioContext.createMediaStreamDestination();

					const [ mixedAudioTrack ] = audioDestination.stream.getAudioTracks();
	
					screenStream = await navigator.mediaDevices.getDisplayMedia(
						RECORDING_CONSTRAINTS
					);
	
					const [ screenVideotrack ] = screenStream.getVideoTracks();
	
					screenVideotrack.addEventListener('ended', () => {
						logger.debug('screenVideotrack ended event');
	
						dispatch(recordingActions.stop());
						clearRecorder();
					});

					recorderStream = new MediaStream([ screenVideotrack, mixedAudioTrack ]);
					recorder = new MediaRecorder(recorderStream, { mimeType });
					idbName = Date.now().toString();
					idbDB = await openDB(idbName, 1, {
						upgrade(db) {
							db.createObjectStore(idbStoreName);
						}
					});

					recorder.addEventListener('stop', () => {
						logger.debug('recording.stop');

						if (!WritableStream)
							streamsaver.WritableStream = WritableStream;

						const fileStream = streamsaver.createWriteStream(`${idbName}.webm`);
						const writer = fileStream.getWriter();

						idbDB.getAllKeys(idbStoreName).then((keys) => {
							saveRecordingWithStreamSaver(
								keys, writer, true, idbDB, idbName
							);
						});
					});

					recorder.addEventListener('error', (event) => {
						logger.error('recording.error', event);
						
						dispatch(recordingActions.stop());
						clearRecorder();
					});

					recorder.addEventListener('dataavailable', async (event) => {
						logger.debug('recording.dataavailable');

						if (event.data.size > 0) {
							try {
								await idbDB.put(idbStoreName, event.data, Date.now());
							} catch (error) {
								logger.error('recording.dataavailable error', error);
							}
						}
					});

					recorder.start(RECORDING_SLICE_SIZE);
				} catch (error) {
					logger.error('recordingActions.start [error:%o]', error);
				}
			}

			return next(action);
		};
	
	return middleware;
};

export default createRecordingMiddleware;