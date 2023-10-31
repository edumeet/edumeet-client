import { Logger } from 'edumeet-common';
import { getEncodings, getVideoConstrains } from '../../utils/encodingsHandler';
import { Resolution } from '../../utils/types';
import { meActions } from '../slices/meSlice';
import { ProducerSource, producersActions } from '../slices/producersSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppThunk } from '../store';
import type { Producer } from 'mediasoup-client/lib/types';
import { roomActions } from '../slices/roomSlice';

const logger = new Logger('MediaActions');

interface UpdateDeviceOptions {
	start?: boolean;
	restart?: boolean;
	newDeviceId?: string;
}

interface AudioSettings {
	autoGainControl?: boolean;
	echoCancellation?: boolean;
	noiseSuppression?: boolean;
	sampleRate?: number;
	channelCount?: number;
	sampleSize?: number;
	opusStereo?: boolean;
	opusDtx?: boolean;
	opusFec?: boolean;
	opusPtime?: number;
	opusMaxPlaybackRate?: number;
}

interface VideoSettings {
	resolution?: Resolution;
	frameRate?: number;
	blurEnabled?: boolean;
}

interface ScreenshareSettings {
	screenSharingResolution?: Resolution;
	screenSharingFrameRate?: number;
}

export const startTranscription = (): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ mediaService }
): Promise<void> => {
	dispatch(roomActions.updateRoom({ startTranscriptionInProgress: true }));

	try {
		await mediaService.startTranscription();
	} catch (error) {
		logger.error('startTranscription() | failed: %o', error);
	} finally {
		dispatch(roomActions.updateRoom({ startTranscriptionInProgress: false }));
	}
};

export const stopTranscription = (): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ mediaService }
): Promise<void> => {
	dispatch(roomActions.updateRoom({ startTranscriptionInProgress: true }));

	try {
		mediaService.stopTranscription();
	} catch (error) {
		logger.error('stopTranscription() | failed: %o', error);
	} finally {
		dispatch(roomActions.updateRoom({ startTranscriptionInProgress: false }));
	}
};

/**
 * This thunk action updates the preview audio track
 * with whatever contraints are set in the store. It may
 * also start or restart the track in the process.
 * 
 * @param options - Options.
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const updatePreviewMic = ({
	restart = false,
	newDeviceId
}: UpdateDeviceOptions = {
	restart: false,
}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService }
): Promise<void> => {
	logger.debug('updatePreviewMic()');

	dispatch(meActions.setAudioInProgress(true));

	let track: MediaStreamTrack | undefined | null;

	try {
		await deviceService.updateMediaDevices();

		const {
			autoGainControl,
			echoCancellation,
			noiseSuppression,
			sampleRate,
			channelCount,
			sampleSize,
		} = getState().settings;
		const deviceId = deviceService.getDeviceId(newDeviceId, 'audioinput');

		if (!deviceId)
			logger.warn('updatePreviewMic() no audio devices');

		if (restart) {
			const { previewMicTrackId } = getState().me;

			if (previewMicTrackId) {
				track = mediaService.getTrack(previewMicTrackId);

				if (track)
					track.stop();

				dispatch(meActions.setPreviewMicTrackId());
			}
		}

		const stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				deviceId: { ideal: deviceId },
				sampleRate,
				channelCount,
				autoGainControl,
				echoCancellation,
				noiseSuppression,
				sampleSize
			}
		});

		([ track ] = stream.getAudioTracks());

		mediaService.addTrack(track);
		dispatch(meActions.setPreviewMicTrackId(track.id));

		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('updatePreviewMic() [error:%o]', error);
	} finally {
		dispatch(meActions.setAudioMuted(false));
		dispatch(meActions.setAudioInProgress(false));
	}
};

/**
 * This thunk action stops the preview audio track.
 * 
 * @param options - Options.
 * @returns {void}
 */
export const stopPreviewMic = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService }
): Promise<void> => {
	logger.debug('stopPreviewMic()');

	dispatch(meActions.setAudioInProgress(true));

	const { previewMicTrackId } = getState().me;

	if (previewMicTrackId) {
		const track = mediaService.getTrack(previewMicTrackId);
		
		dispatch(meActions.setPreviewMicTrackId());

		if (track) {
			mediaService.removeTrack(track.id);
			track.stop();
		}
	}

	dispatch(meActions.setAudioInProgress(false));
};

/**
 * This thunk action updates the preview video track
 * with whatever contraints are set in the store. It may
 * also start or restart the track in the process.
 * 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const updatePreviewWebcam = ({
	restart = false,
	newDeviceId
}: UpdateDeviceOptions = {}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService, effectsService }
): Promise<void> => {
	logger.debug('updatePreviewWebcam()');

	dispatch(meActions.setVideoInProgress(true));

	let track: MediaStreamTrack | undefined | null;

	try {
		await deviceService.updateMediaDevices();

		const {
			aspectRatio,
			resolution,
			frameRate,
			blurEnabled,
		} = getState().settings;

		const deviceId = deviceService.getDeviceId(newDeviceId, 'videoinput');

		if (!deviceId)
			logger.warn('updatePreviewWebcam() no webcam devices');

		if (restart) {
			const { previewWebcamTrackId } = getState().me;

			if (previewWebcamTrackId) {
				track = mediaService.getTrack(previewWebcamTrackId);

				if (track) {
					track.stop();
					effectsService.stop(track.id);
				}

				dispatch(meActions.setPreviewWebcamTrackId());
			}
		}

		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				deviceId: { ideal: deviceId },
				...getVideoConstrains(resolution, aspectRatio),
				frameRate
			}
		});

		([ track ] = stream.getVideoTracks());

		if (blurEnabled) track = await effectsService.applyEffect(track);

		mediaService.addTrack(track);
		dispatch(meActions.setPreviewWebcamTrackId(track.id));

		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('updatePreviewWebcam() [error:%o]', error);
	} finally {
		dispatch(meActions.setVideoInProgress(false));
	}
};

/**
 * This thunk action stops the preview video track.
 * 
 * @param options - Options.
 * @returns {void}
 */
export const stopPreviewWebcam = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, effectsService }
): Promise<void> => {
	logger.debug('stopPreviewWebcam()');

	dispatch(meActions.setVideoInProgress(true));

	const { previewWebcamTrackId } = getState().me;

	if (previewWebcamTrackId) {
		const track = mediaService.getTrack(previewWebcamTrackId);

		dispatch(meActions.setPreviewWebcamTrackId());

		if (track) {
			mediaService.removeTrack(track.id);
			track.stop();
			effectsService.stop(track.id);
		}
	}

	dispatch(meActions.setVideoInProgress(false));
};

/**
 * This thunk action updates the audio settings in the store,
 * stops the preview audio track, starts/restarts the main audio
 * track and starts/restarts the preview audio track.
 * 
 * @param settings - Settings.
 * @returns {Promise<void>} Promise.
 */
export const updateAudioSettings = (
	settings: AudioSettings = {}
): AppThunk<Promise<void>> => async (
	dispatch
): Promise<void> => {
	logger.debug('updateAudioSettings()');

	dispatch(settingsActions.updateSettings(settings));
	dispatch(stopPreviewMic());
	await dispatch(updateMic());
	await dispatch(updatePreviewMic());
};

/**
 * This thunk action starts/restarts the main audio track.
 * It will use the MediaService to create the Producer from it
 * which will send it to the server.
 * 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const updateMic = ({
	start = false,
	restart = true,
	newDeviceId
}: UpdateDeviceOptions = {
	start: false,
	restart: true,
}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService }
): Promise<void> => {
	logger.debug(
		'updateMic() [start:%s, restart:%s, newDeviceId:"%s"]',
		start,
		restart,
		newDeviceId
	);

	dispatch(meActions.setAudioInProgress(true));

	let track: MediaStreamTrack | null | undefined;
	let micProducer: Producer | undefined;

	try {
		await deviceService.updateMediaDevices();

		const canSendMic = getState().me.canSendMic;

		if (!canSendMic) throw new Error('cannot produce audio');
		if (newDeviceId && !restart) throw new Error('changing device requires restart');
		if (newDeviceId) dispatch(settingsActions.setSelectedAudioDevice(newDeviceId));

		const previewMicTrackId = getState().me.previewMicTrackId;
		const selectedAudioDevice = getState().settings.selectedAudioDevice;
		const deviceId = deviceService.getDeviceId(selectedAudioDevice, 'audioinput');

		if (!deviceId) logger.warn('no audio devices');

		const {
			autoGainControl,
			echoCancellation,
			noiseSuppression,
			sampleRate,
			channelCount,
			sampleSize,
			opusStereo,
			opusDtx,
			opusFec,
			opusPtime,
			opusMaxPlaybackRate
		} = getState().settings;

		micProducer = mediaService.getProducers().find((producer) => producer.appData.source === 'mic');

		if ((restart && micProducer) || start) {
			if (micProducer) {
				dispatch(producersActions.closeProducer({
					producerId: micProducer.id,
					local: true
				}));
			}

			if (previewMicTrackId) track = mediaService.getTrack(previewMicTrackId);

			if (!track) {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: {
						deviceId: { ideal: deviceId },
						sampleRate,
						channelCount,
						autoGainControl,
						echoCancellation,
						noiseSuppression,
						sampleSize
					}
				});

				([ track ] = stream.getAudioTracks());
			}

			if (!track) throw new Error('no mic track');

			dispatch(meActions.setPreviewMicTrackId());

			if (previewMicTrackId) mediaService.removeTrack(previewMicTrackId);

			const { deviceId: trackDeviceId } = track.getSettings();

			dispatch(settingsActions.setSelectedAudioDevice(trackDeviceId));

			micProducer = await mediaService.produce({
				track,
				codecOptions: {
					opusStereo: opusStereo,
					opusFec: opusFec,
					opusDtx: opusDtx,
					opusMaxPlaybackRate: opusMaxPlaybackRate,
					opusPtime: opusPtime
				},
				appData: { source: 'mic' }
			});

			dispatch(producersActions.addProducer({
				id: micProducer.id,
				kind: micProducer.kind,
				source: micProducer.appData.source as ProducerSource,
				paused: micProducer.paused
			}));
		} else if (micProducer) {
			({ track } = micProducer);

			await track?.applyConstraints({
				sampleRate,
				channelCount,
				autoGainControl,
				echoCancellation,
				noiseSuppression,
				sampleSize
			});
		}

		dispatch(meActions.setAudioMuted(false));

		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('updateMic() [error:%o]', error);
	} finally {
		dispatch(meActions.setAudioInProgress(false));
	}
};

/**
 * This thunk action updates the video settings in the store,
 * stops the preview video track, starts/restarts the main video
 * track and starts/restarts the preview video track.
 * 
 * @param settings - Settings.
 * @returns {Promise<void>} Promise.
 */
export const updateVideoSettings = (
	settings: VideoSettings = {}
): AppThunk<Promise<void>> => async (dispatch): Promise<void> => {
	logger.debug('updateVideoSettings()');

	dispatch(settingsActions.updateSettings(settings));
	dispatch(stopPreviewWebcam());
	await dispatch(updateWebcam({ restart: true }));
	await dispatch(updatePreviewWebcam());
};

/**
 * This thunk action updates the video settings in the store,
 * stops the preview video track, starts/restarts the main video
 * track and starts/restarts the preview video track.
 * 
 * @param settings - Settings.
 * @returns {Promise<void>} Promise.
 */
export const updateAdvancedVideoSettings = (
	settings: VideoSettings = {}
): AppThunk<Promise<void>> => async (dispatch): Promise<void> => {
	logger.debug('updateVideoSettings()');

	dispatch(settingsActions.updateSettings(settings));
	await dispatch(updateWebcam({ restart: true }));
};

/**
 * This thunk action starts/restarts the main video track.
 * It will use the MediaService to create the Producer from it
 * which will send it to the server.
 * 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const updateWebcam = ({
	start = false,
	restart = false,
	newDeviceId,
}: UpdateDeviceOptions = {
	start: false,
	restart: false,
}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService, effectsService, config }
): Promise<void> => {
	logger.debug(
		'updateWebcam [start:%s, restart:%s, newDeviceId:%s]',
		start,
		restart,
		newDeviceId,
	);

	dispatch(meActions.setVideoInProgress(true));

	let track: MediaStreamTrack | null | undefined;
	let webcamProducer: Producer | undefined;

	try {
		if (!mediaService.rtpCapabilities) throw new Error('RTP Capabilities are not yet ready');

		await deviceService.updateMediaDevices();

		const canSendWebcam = getState().me.canSendWebcam;

		if (!canSendWebcam) throw new Error('cannot produce video');
		if (newDeviceId && !restart) throw new Error('changing device requires restart');
		if (newDeviceId) dispatch(settingsActions.setSelectedVideoDevice(newDeviceId));

		const {
			aspectRatio,
			resolution,
			frameRate,
			selectedVideoDevice,
			blurEnabled,
		} = getState().settings;
		
		const deviceId = deviceService.getDeviceId(selectedVideoDevice, 'videoinput');
		const previewWebcamTrackId = getState().me.previewWebcamTrackId;

		if (!deviceId) logger.warn('no webcam devices');

		webcamProducer = mediaService.getProducers().find((producer) => producer.appData.source === 'webcam');

		if ((restart && webcamProducer) || start) {
			if (webcamProducer) {
				dispatch(producersActions.closeProducer({
					producerId: webcamProducer.id,
					local: true
				}));
			}

			if (previewWebcamTrackId) track = mediaService.getTrack(previewWebcamTrackId);

			const havePreviewTrack = Boolean(track);

			if (!havePreviewTrack) {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						deviceId: { ideal: deviceId },
						...getVideoConstrains(resolution, aspectRatio),
						frameRate
					}
				});
	
				([ track ] = stream.getVideoTracks());
			}

			if (!track) throw new Error('no webcam track');

			dispatch(meActions.setPreviewWebcamTrackId());

			if (previewWebcamTrackId) mediaService.removeTrack(previewWebcamTrackId);

			const { deviceId: trackDeviceId, width, height } = track.getSettings();

			if (blurEnabled && !havePreviewTrack) track = await effectsService.applyEffect(track);

			// User may have chosen a different device than the one initially selected
			// so we need to update the selected device in the settings just in case
			dispatch(settingsActions.setSelectedVideoDevice(trackDeviceId));

			if (config.simulcast) {
				const encodings = getEncodings(
					mediaService.rtpCapabilities,
					width,
					height
				);
	
				webcamProducer = await mediaService.produce({
					track,
					encodings,
					codecOptions: {
						videoGoogleStartBitrate: 1000
					},
					appData: { source: 'webcam' }
				});
			} else {
				webcamProducer = await mediaService.produce({
					track,
					appData: { source: 'webcam' }
				});
			}

			dispatch(producersActions.addProducer({
				id: webcamProducer.id,
				kind: webcamProducer.kind,
				source: webcamProducer.appData.source as ProducerSource,
				paused: webcamProducer.paused,
			}));
		} else if (webcamProducer) {
			({ track } = webcamProducer);

			await track?.applyConstraints({
				...getVideoConstrains(resolution, aspectRatio),
				frameRate
			});

			const extraVideoProducers = mediaService.getProducers().filter((producer) => producer.appData.source === 'extravideo');

			// Also change resolution of extra video producers
			for (const producer of extraVideoProducers) {
				({ track } = producer);

				await track?.applyConstraints({
					...getVideoConstrains(resolution, aspectRatio),
					frameRate
				});
			}
		}

		dispatch(meActions.setVideoMuted(false));

		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('updateWebcam() [error:%o]', error);
	} finally {
		dispatch(meActions.setVideoInProgress(false));
	}
};

/**
 * This thunk action updates the screen sharing settings in the store,
 * starts/restarts the screen sharing track.
 * 
 * @param settings 
 * @returns {Promise<void>} Promise.
 */
export const updateScreenshareSettings = (
	settings: ScreenshareSettings = {}
): AppThunk<Promise<void>> => async (dispatch): Promise<void> => {
	logger.debug('updateVideoSettings()');

	dispatch(settingsActions.updateSettings(settings));
	await dispatch(updateScreenSharing());
};

/**
 * This thunk action starts/restarts the main screen sharing track.
 * It will use the MediaService to create the Producer from it
 * which will send it to the server.
 * 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const updateScreenSharing = ({
	start = false,
	restart = false,
}: UpdateDeviceOptions = {
	start: false,
	restart: false
}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, config }
): Promise<void> => {
	logger.debug(
		'updateScreenSharing() [start:%s, restart:%s]',
		start,
		restart
	);

	dispatch(meActions.setScreenSharingInProgress(true));

	let audioTrack: MediaStreamTrack | null | undefined;
	let videoTrack: MediaStreamTrack | null | undefined;
	let screenAudioProducer: Producer | undefined;
	let screenVideoProducer: Producer | undefined;

	try {
		if (!mediaService.rtpCapabilities) throw new Error('RTP Capabilities are not yet ready');

		const canShareScreen = getState().me.canShareScreen;

		if (!canShareScreen) throw new Error('cannot produce screen share');

		const {
			screenSharingResolution,
			screenSharingFrameRate,
			autoGainControl,
			echoCancellation,
			noiseSuppression,
			aspectRatio,
			sampleRate,
			channelCount,
			sampleSize,
			opusStereo,
			opusDtx,
			opusFec,
			opusPtime,
			opusMaxPlaybackRate
		} = getState().settings;

		screenVideoProducer = mediaService.getProducers().find((producer) => producer.appData.source === 'screen');
		screenAudioProducer = mediaService.getProducers().find((producer) => producer.appData.source === 'screenaudio');

		if ((restart && (screenVideoProducer || screenAudioProducer)) || start) {
			if (screenVideoProducer) {
				dispatch(producersActions.closeProducer({
					producerId: screenVideoProducer.id,
					local: true
				}));
			}

			if (screenAudioProducer) {
				dispatch(producersActions.closeProducer({
					producerId: screenAudioProducer.id,
					local: true
				}));
			}

			const SCREENSHARE_CONSTRAINTS = {
				video: {
					...getVideoConstrains(
						screenSharingResolution,
						aspectRatio
					),
					frameRate: screenSharingFrameRate,
				},
				audio: {
					sampleRate,
					channelCount,
					autoGainControl,
					echoCancellation,
					noiseSuppression,
					sampleSize
				},
				selfBrowserSurface: 'include'
			};

			const stream = await navigator.mediaDevices.getDisplayMedia(SCREENSHARE_CONSTRAINTS);

			([ videoTrack ] = stream.getVideoTracks());

			if (!videoTrack) throw new Error('no screen track');

			const { width, height } = videoTrack.getSettings();

			if (config.simulcastSharing) {
				const encodings = getEncodings(
					mediaService.rtpCapabilities,
					width,
					height,
				);

				screenVideoProducer = await mediaService.produce({
					track: videoTrack,
					encodings,
					codecOptions: {
						videoGoogleStartBitrate: 1000
					},
					appData: { source: 'screen' }
				});
			} else {
				screenVideoProducer = await mediaService.produce({
					track: videoTrack,
					codecOptions: {
						videoGoogleStartBitrate: 1000
					},
					appData: { source: 'screen' }
				});
			}

			dispatch(producersActions.addProducer({
				id: screenVideoProducer.id,
				kind: screenVideoProducer.kind,
				source: screenVideoProducer.appData.source as ProducerSource,
				paused: screenVideoProducer.paused,
			}));

			([ audioTrack ] = stream.getAudioTracks());

			if (audioTrack) {
				screenAudioProducer = await mediaService.produce({
					track: audioTrack,
					codecOptions: {
						opusStereo: opusStereo,
						opusFec: opusFec,
						opusDtx: opusDtx,
						opusMaxPlaybackRate: opusMaxPlaybackRate,
						opusPtime: opusPtime
					},
					appData: { source: 'screenaudio' }
				});

				dispatch(producersActions.addProducer({
					id: screenAudioProducer.id,
					kind: screenAudioProducer.kind,
					source: screenAudioProducer.appData.source as ProducerSource,
					paused: screenAudioProducer.paused,
				}));
			}
		} else {
			if (screenVideoProducer) {
				({ track: videoTrack } = screenVideoProducer);

				await videoTrack?.applyConstraints({
					...getVideoConstrains(screenSharingResolution, aspectRatio),
					frameRate: screenSharingFrameRate
				});
			}

			if (screenAudioProducer) {
				({ track: audioTrack } = screenAudioProducer);

				await audioTrack?.applyConstraints({
					sampleRate,
					channelCount,
					autoGainControl,
					echoCancellation,
					noiseSuppression,
					sampleSize
				});
			}
		}
	} catch (error) {
		logger.error('updateScreenSharing() [error:%o]', error);
	} finally {
		dispatch(meActions.setScreenSharingInProgress(false));
	}
};

/**
 * This thunk action starts and extra video track.
 * It will use the MediaService to create the Producer from it
 * which will send it to the server.
 * 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const startExtraVideo = ({
	newDeviceId
}: UpdateDeviceOptions = {}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService, config }
): Promise<void> => {
	logger.debug('startExtraVideo [newDeviceId:%s]', newDeviceId);

	dispatch(meActions.setVideoInProgress(true));

	let track: MediaStreamTrack | null | undefined;
	let extraVideoProducer: Producer | undefined;

	try {
		if (!mediaService.rtpCapabilities) throw new Error('RTP Capabilities are not yet ready');

		if (!newDeviceId) throw new Error('newDeviceId is not defined');

		await deviceService.updateMediaDevices();

		const canSendWebcam = getState().me.canSendWebcam;

		if (!canSendWebcam) throw new Error('cannot produce video');

		const {
			aspectRatio,
			resolution,
			frameRate,
		} = getState().settings;
		
		const deviceId = deviceService.getDeviceId(newDeviceId, 'videoinput');

		if (!deviceId) logger.warn('no extravideo device');

		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				deviceId: { ideal: deviceId },
				...getVideoConstrains(resolution, aspectRatio),
				frameRate,
			}
		});

		([ track ] = stream.getVideoTracks());

		const { width, height } = track.getSettings();

		if (config.simulcast) {
			const encodings = getEncodings(mediaService.rtpCapabilities, width, height);

			extraVideoProducer = await mediaService.produce({
				track,
				encodings,
				codecOptions: {
					videoGoogleStartBitrate: 1000
				},
				appData: { source: 'extravideo' }
			});
		} else {
			extraVideoProducer = await mediaService.produce({
				track,
				appData: { source: 'extravideo' }
			});
		}

		dispatch(producersActions.addProducer({
			id: extraVideoProducer.id,
			kind: extraVideoProducer.kind,
			source: extraVideoProducer.appData.source as ProducerSource,
			paused: extraVideoProducer.paused,
		}));

		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('startExtraVideo() [error:%o]', error);
	} finally {
		dispatch(meActions.setVideoInProgress(false));
	}
};

/**
 * This thunk action starts and extra audio track.
 * It will use the MediaService to create the Producer from it
 * which will send it to the server.
 * 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const startExtraAudio = ({
	newDeviceId
}: UpdateDeviceOptions = {}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService }
): Promise<void> => {
	logger.debug('startExtraAudio() [newDeviceId:"%s"]', newDeviceId);

	dispatch(meActions.setAudioInProgress(true));

	let track: MediaStreamTrack | null | undefined;
	let extraAudioProducer: Producer | undefined;

	try {
		await deviceService.updateMediaDevices();

		const canSendMic = getState().me.canSendMic;

		if (!canSendMic) throw new Error('cannot produce audio');

		const deviceId = deviceService.getDeviceId(newDeviceId, 'audioinput');

		if (!deviceId) logger.warn('no audio devices');

		const {
			autoGainControl,
			echoCancellation,
			noiseSuppression,
			sampleRate,
			channelCount,
			sampleSize,
			opusStereo,
			opusDtx,
			opusFec,
			opusPtime,
			opusMaxPlaybackRate
		} = getState().settings;

		const stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				deviceId: { ideal: deviceId },
				sampleRate,
				channelCount,
				autoGainControl,
				echoCancellation,
				noiseSuppression,
				sampleSize
			}
		});

		([ track ] = stream.getAudioTracks());

		if (!track) throw new Error('no mic track');

		extraAudioProducer = await mediaService.produce({
			track,
			codecOptions: {
				opusStereo: opusStereo,
				opusFec: opusFec,
				opusDtx: opusDtx,
				opusMaxPlaybackRate: opusMaxPlaybackRate,
				opusPtime: opusPtime
			},
			appData: { source: 'extraaudio' }
		});

		dispatch(producersActions.addProducer({
			id: extraAudioProducer.id,
			kind: extraAudioProducer.kind,
			source: extraAudioProducer.appData.source as ProducerSource,
			paused: extraAudioProducer.paused
		}));

		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('startExtraAudio() [error:%o]', error);
	} finally {
		dispatch(meActions.setAudioInProgress(false));
	}
};