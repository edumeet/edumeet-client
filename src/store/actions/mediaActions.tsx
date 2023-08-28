import { Logger, MediaKind } from 'edumeet-common';
import { Producer } from 'mediasoup-client/lib/Producer';
import { getEncodings, getVideoConstrains } from '../../utils/encodingsHandler';
import { Resolution } from '../../utils/types';
import { meActions } from '../slices/meSlice';
import { producersActions, ProducerSource } from '../slices/producersSlice';
import { roomActions } from '../slices/roomSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppThunk } from '../store';
import { mediaActions } from '../slices/mediaSlice';
import { BlurBackgroundNotSupportedError } from '../../services/BlurBackground';
import { notificationsActions } from '../slices/notificationsSlice';
import { blurBackgroundNotSupported } from '../../components/translated/translatedComponents';
import hark from 'hark';
import { VolumeWatcher } from '../../utils/volumeWatcher';

const logger = new Logger('MediaActions');

interface UpdateDeviceOptions {
	start?: boolean;
	restart?: boolean;
	unMute?: boolean;
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
export const updatePreviewMic = (newDeviceId?: string): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService }
): Promise<void> => {
	logger.debug('updatePreviewMic()');

	dispatch(mediaActions.setAudioInProgress(true));

	let track: MediaStreamTrack | undefined;
	let deviceId: string | undefined;

	try {
		await deviceService.updateMediaDevices();

		if (newDeviceId)
			dispatch(mediaActions.setPreviewAudioInputDeviceId(newDeviceId));

		const { previewAudioInputDeviceId, previewMicTrackId } = getState().media;

		if (previewMicTrackId) {
			mediaService.getTrack(previewMicTrackId, 'previewTracks')?.stop();
			mediaService.removePreviewTrack(previewMicTrackId);
			dispatch(mediaActions.setPreviewMicTrackId());
		}

		const {
			autoGainControl,
			echoCancellation,
			noiseSuppression,
			sampleRate,
			channelCount,
			sampleSize,
		} = getState().settings;

		deviceId = previewAudioInputDeviceId;
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

		if (!stream) throw new Error('Could not create MediaStream');
		track = stream.getAudioTracks()[0];
		deviceId = track.getSettings().deviceId;
		if (!deviceId) throw new Error('No deviceId found');
		
		// We may have ended up with a different device than the one selected
		// so we need to update the selected device in the settings just in case
		dispatch(mediaActions.setPreviewAudioInputDeviceId(deviceId));

		mediaService.addTrack(track, deviceId, 'previewTracks');
		dispatch(mediaActions.setPreviewMicTrackId(track.id));
		dispatch(mediaActions.setAudioMuted(false));

		// Add VolumeWatcher
		const harkStream = new MediaStream();

		harkStream.addTrack(track);
		const previewMicHark = hark(harkStream, {
			play: false,
			interval: 100,
			threshold: -60,
			history: 100
		});

		mediaService.previewVolumeWatcher = new VolumeWatcher({ hark: previewMicHark }); 

		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('updatePreviewMic() [error:%o]', error);
	} finally {
		dispatch(mediaActions.setAudioInProgress(false));
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

	dispatch(mediaActions.setAudioInProgress(true));

	const { previewMicTrackId } = getState().media;

	if (previewMicTrackId) {
		const track = mediaService.getTrack(previewMicTrackId, 'previewTracks');

		dispatch(mediaActions.setPreviewMicTrackId());

		mediaService.removePreviewTrack(track?.id);
		track?.stop();
	}

	delete mediaService.previewVolumeWatcher;

	dispatch(mediaActions.setAudioInProgress(false));
};

/**
 * This thunk action updates the preview video track
 * with whatever contraints are set in the store. It may
 * also start or restart the track in the process.
 * 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const updatePreviewWebcam = (newDeviceId?: string): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService, effectService }
): Promise<void> => {
	logger.debug('updatePreviewWebcam() [newDeviceId: %s]', newDeviceId);

	dispatch(mediaActions.setVideoInProgress(true));

	let track: MediaStreamTrack | undefined;
	let deviceId: string | undefined;
	let stream: MediaStream | undefined;

	try {
		await deviceService.updateMediaDevices();

		if (newDeviceId)
			dispatch(mediaActions.setPreviewVideoDeviceId(newDeviceId));
		
		const { previewWebcamTrackId,
			previewVideoDeviceId,
			previewBlurBackground,
		} = getState().media;

		if (previewWebcamTrackId) {
			mediaService.getTrack(previewWebcamTrackId, 'previewTracks')?.stop();
			mediaService.removePreviewTrack(previewWebcamTrackId);
			dispatch(mediaActions.setPreviewWebcamTrackId());
		}

		const {
			aspectRatio,
			resolution,
			frameRate,
		} = getState().settings;

		deviceId = previewVideoDeviceId;
		stream = await navigator.mediaDevices.getUserMedia({
			video: {
				deviceId: { ideal: deviceId },
				...getVideoConstrains(resolution, aspectRatio),
				frameRate
			}
		});

		if (!stream) throw new Error('Could not create MediaStream');
		track = stream.getVideoTracks()[0];
		deviceId = track.getSettings().deviceId;

		// We may have ended up with a different device than the one selected
		// so we need to update the selected device in the settings just in case
		dispatch(mediaActions.setPreviewVideoDeviceId(deviceId));

		let blurTrack;

		if (previewBlurBackground) {
			try {
				if (!deviceId) throw new Error('No deviceId found');
				effectService.stopBlurEffect('preview');
				({ blurTrack } = await effectService.startBlurEffect(stream, 'preview'));

				mediaService.addTrack(blurTrack, deviceId, 'previewTracks');
				dispatch(mediaActions.setPreviewWebcamTrackId(blurTrack.id));
				dispatch(mediaActions.setVideoMuted(false));
			} catch (e) {
				if (e instanceof BlurBackgroundNotSupportedError) {
					dispatch(mediaActions.setPreviewBlurBackground(false));
					dispatch(meActions.setCanBlurBackground(false));
					dispatch(notificationsActions.enqueueNotification({
						message: blurBackgroundNotSupported(),
						options: { variant: 'error' }
					}));
				}
				logger.error(e);
			}
		}
		
		if (!blurTrack) { 
			// Either blurBackground failed, or it's not enabled. Add unprocessed track.
			if (!deviceId) throw new Error('No deviceId found');
			mediaService.addTrack(track, deviceId, 'previewTracks');
			dispatch(mediaActions.setPreviewWebcamTrackId(track.id));
			dispatch(mediaActions.setVideoMuted(false));
		}
		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('updatePreviewWebcam() [error:%o]', error);
	} finally {
		dispatch(mediaActions.setVideoInProgress(false));
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
	{ mediaService, effectService }
): Promise<void> => {
	logger.debug('stopPreviewWebcam()');
	dispatch(mediaActions.setVideoInProgress(true));
	const { previewWebcamTrackId, previewBlurBackground } = getState().media;

	if (previewWebcamTrackId) {
		const track = mediaService.getTrack(previewWebcamTrackId, 'previewTracks');

		dispatch(mediaActions.setPreviewWebcamTrackId());
		mediaService.removePreviewTrack(track?.id);
		track?.stop();
	}

	previewBlurBackground && effectService.stopBlurEffect('preview');
	dispatch(mediaActions.setVideoInProgress(false));
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
	await dispatch(updateLiveMic());
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
export const updateLiveMic = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService }
): Promise<void> => {
	logger.debug(
		'updateLiveMic()');

	dispatch(mediaActions.setAudioInProgress(true));

	let track: MediaStreamTrack | null | undefined;
	let micProducer: Producer | undefined;

	try {
		await deviceService.updateMediaDevices();

		const { canSendMic } = getState().me;

		if (!canSendMic)
			throw new Error('cannot produce audio');

		const { liveMicTrackId, liveAudioInputDeviceId } = getState().media;

		if (liveMicTrackId) {
			track = mediaService.getTrack(liveMicTrackId, 'liveTracks');
			track?.stop();
			mediaService.removeLiveTrack(liveMicTrackId);
		}

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
			opusMaxPlaybackRate,
		} = getState().settings;

		if (!liveAudioInputDeviceId)
			throw new Error('Selected live audio device not found');

		micProducer =
			mediaService.getProducers()
				.find((producer) => producer.appData.source === 'mic');

		let muted = false;

		if (micProducer) {
			muted = micProducer.paused;
			dispatch(producersActions.closeProducer({
				producerId: micProducer.id,
				local: true
			}));
		}
			
		// At this point we want the exact device, or none at all.
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				deviceId: { exact: liveAudioInputDeviceId },
				sampleRate,
				channelCount,
				autoGainControl,
				echoCancellation,
				noiseSuppression,
				sampleSize
			}
		});

		track = stream.getAudioTracks()[0];

		if (!track)
			throw new Error('no live mic track');

		mediaService.addTrack(track, liveAudioInputDeviceId, 'liveTracks');
		dispatch(mediaActions.setLiveMicTrackId(track.id));

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

		dispatch(mediaActions.setAudioMuted(false));

		if (muted) {
			dispatch(
				producersActions.setProducerPaused({
					producerId: micProducer.id,
					local: true
				})
			);
		} else {
			dispatch(
				producersActions.setProducerResumed({
					producerId: micProducer.id,
					local: true
				})
			);
		}
		track = micProducer.track;

		await track?.applyConstraints({
			sampleRate,
			channelCount,
			autoGainControl,
			echoCancellation,
			noiseSuppression,
			sampleSize
		});

		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('updateMic() [error:%o]', error);
	} finally {
		dispatch(mediaActions.setAudioInProgress(false));
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
	await dispatch(updateLiveWebcam());
	await dispatch(updatePreviewWebcam());
};

/**
 * This thunk action starts/restarts the main video track.
 * It will use the MediaService to create the Producer from it
 * which will send it to the server.
 * 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const updateLiveWebcam = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService, config, effectService }
): Promise<void> => {
	logger.debug('updateLiveWebcam()');
	dispatch(mediaActions.setVideoInProgress(true));

	let track: MediaStreamTrack | null | undefined;
	let webcamProducer: Producer | null | undefined;
	let stream: MediaStream | undefined;

	try {
		await deviceService.updateMediaDevices();

		const { canSendWebcam } = getState().me;

		if (!canSendWebcam)
			throw new Error('cannot produce video');

		const {
			liveVideoDeviceId,
			liveBlurBackground,
			liveWebcamTrackId 
		} = getState().media;

		if (liveWebcamTrackId) {
			track = mediaService.getTrack(liveWebcamTrackId, 'liveTracks');
			track?.stop();
			mediaService.removeLiveTrack(liveWebcamTrackId);
		}

		const {
			aspectRatio,
			resolution,
			frameRate,
		} = getState().settings;
		
		if (!liveVideoDeviceId)
			throw new Error('Selected live video device not found');

		webcamProducer =
			mediaService.getProducers()
				.find((producer) => producer.appData.source === 'webcam');

		if (webcamProducer) {
			dispatch(producersActions.closeProducer({
				producerId: webcamProducer.id,
				local: true
			}));
		}

		// At this point we want the exact device chosen, or none at all.
		stream = await navigator.mediaDevices.getUserMedia({
			video: {
				deviceId: { exact: liveVideoDeviceId },
				...getVideoConstrains(resolution, aspectRatio),
				frameRate
			}
		});

		track = stream.getVideoTracks()[0];

		if (!track)
			throw new Error('no live webcam track');

		let blurTrack: MediaStreamTrack | undefined;
		let width: number | undefined, height: number | undefined;

		if (liveBlurBackground) {
			try {
				effectService.stopBlurEffect('live');
				({ blurTrack, width, height } = await effectService.startBlurEffect(stream, 'live'));
				logger.debug(blurTrack);
				mediaService.addTrack(blurTrack, liveVideoDeviceId, 'liveTracks');
				dispatch(mediaActions.setLiveWebcamTrackId(blurTrack.id));
			} catch (e) {
				if (e instanceof BlurBackgroundNotSupportedError) {
					dispatch(mediaActions.setLiveBlurBackground(false));
					dispatch(meActions.setCanBlurBackground(false));
				}
				logger.error(e);
			}
		}
		
		if (!blurTrack) { 
			// Either blurBackground failed, or it's not enabled. Add unprocessed track.
			mediaService.addTrack(track, liveVideoDeviceId, 'liveTracks');
			dispatch(mediaActions.setLiveWebcamTrackId(track.id));
			({ width, height } = track.getSettings());
		}

		if (config.simulcast) {
			const encodings = getEncodings(
				mediaService.rtpCapabilities,
				width,
				height
			);

			const resolutionScalings =
				encodings.map((encoding) => encoding.scaleResolutionDownBy);

			webcamProducer = await mediaService.produce({
				track: blurTrack ?? track,
				encodings,
				codecOptions: {
					videoGoogleStartBitrate: 1000
				},
				appData: {
					source: 'webcam',
					width,
					height,
					resolutionScalings
				}
			});
		} else {
			webcamProducer = await mediaService.produce({
				track: blurTrack ?? track,
				appData: {
					source: 'webcam',
					width,
					height
				}
			});
		}

		dispatch(producersActions.addProducer({
			id: webcamProducer.id,
			kind: webcamProducer.kind,
			source: webcamProducer.appData.source as ProducerSource,
			paused: webcamProducer.paused,
		}));

		dispatch(mediaActions.setVideoMuted(false));
	
		if (webcamProducer) {
			({ track } = webcamProducer);

			await track?.applyConstraints({
				...getVideoConstrains(resolution, aspectRatio),
				frameRate
			});

			const extraVideoProducers =
				mediaService.getProducers()
					.filter((producer) => producer.appData.source === 'extravideo');

			// Also change resolution of extra video producers
			for (const producer of extraVideoProducers) {
				({ track } = producer);

				await track?.applyConstraints({
					...getVideoConstrains(resolution, aspectRatio),
					frameRate
				});
			}
		}

		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('updateWebcam() [error:%o]', error);
	} finally {
		dispatch(mediaActions.setVideoInProgress(false));
	}
};

/**
 * This thunk action stops the preview video track.
 * 
 * @param options - Options.
 * @returns {void}
 */
export const stopLiveWebcam = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, effectService }
): Promise<void> => {
	logger.debug('stopLiveWebcam()');
	dispatch(mediaActions.setVideoInProgress(true));
	const { liveWebcamTrackId, liveBlurBackground } = getState().media;

	if (liveWebcamTrackId) {
		const track = mediaService.getTrack(liveWebcamTrackId, 'liveTracks');

		dispatch(mediaActions.setLiveWebcamTrackId());
		mediaService.removeLiveTrack(track?.id);
		track?.stop();
	}

	liveBlurBackground && effectService.stopBlurEffect('live');

	dispatch(mediaActions.setVideoInProgress(false));
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
	let screenAudioProducer: Producer | null | undefined;
	let screenVideoProducer: Producer | null | undefined;

	try {
		const canShareScreen = getState().me.canShareScreen;

		if (!canShareScreen)
			throw new Error('cannot produce screen share');

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

		screenVideoProducer =
			mediaService.getProducers()
				.find((producer) => producer.appData.source === 'screen');
		screenAudioProducer =
			mediaService.getProducers()
				.find((producer) => producer.appData.source === 'screenaudio');

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

			if (!videoTrack)
				throw new Error('no screen track');

			const { width, height } = videoTrack.getSettings();

			if (config.simulcastSharing) {
				const encodings = getEncodings(
					mediaService.rtpCapabilities,
					width,
					height,
				);

				const resolutionScalings =
					encodings.map((encoding) => encoding.scaleResolutionDownBy);

				screenVideoProducer = await mediaService.produce({
					track: videoTrack,
					encodings,
					codecOptions: {
						videoGoogleStartBitrate: 1000
					},
					appData: {
						source: 'screen',
						width,
						height,
						resolutionScalings
					}
				});
			} else {
				screenVideoProducer = await mediaService.produce({
					track: videoTrack,
					codecOptions: {
						videoGoogleStartBitrate: 1000
					},
					appData: {
						source: 'screen',
						width,
						height
					}
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
					appData: { source: 'mic' }
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

	dispatch(mediaActions.setVideoInProgress(true));

	let track: MediaStreamTrack | null | undefined;
	let extraVideoProducer: Producer | null | undefined;

	try {
		if (!newDeviceId)
			throw new Error('newDeviceId is not defined');

		await deviceService.updateMediaDevices();

		const canSendWebcam = getState().me.canSendWebcam;

		if (!canSendWebcam)
			throw new Error('cannot produce video');

		const {
			aspectRatio,
			resolution,
			frameRate,
		} = getState().settings;
		
		const deviceId = deviceService.getDeviceId('videoinput');

		if (!deviceId)
			logger.warn('no extravideo device');

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
			const resolutionScalings =
				encodings.map((encoding) => encoding.scaleResolutionDownBy);

			extraVideoProducer = await mediaService.produce({
				track,
				encodings,
				codecOptions: {
					videoGoogleStartBitrate: 1000
				},
				appData: {
					source: 'extravideo',
					width,
					height,
					resolutionScalings
				}
			});

		} else {
			extraVideoProducer = await mediaService.produce({
				track,
				appData: { source: 'extravideo', width, height }
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
		dispatch(mediaActions.setVideoInProgress(false));
	}
};

/** 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const getUserMedia = (mediaKind: MediaKind): AppThunk<Promise<void>> => async (getState, dispatch, { deviceService }): Promise<void> => {
	logger.debug('getUserMedia() [mediaKind:%s]', mediaKind);

	await navigator.mediaDevices.getUserMedia({
		audio: mediaKind === 'audio',
		video: mediaKind === 'video'
	}).catch((e) => logger.error(e));
	await deviceService.updateMediaDevices();
};