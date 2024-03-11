import { Logger } from 'edumeet-common';
import { getEncodings, getVideoConstrains } from '../../utils/encodingsHandler';
import { Resolution } from '../../utils/types';
import { meActions } from '../slices/meSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppThunk } from '../store';
import { roomActions } from '../slices/roomSlice';

const logger = new Logger('MediaActions');

interface UpdateDeviceOptions {
	start?: boolean;
	replace?: boolean;
	newDeviceId?: string;
	enable?: boolean;
	updateSelection?: boolean;
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
) => {
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
	start: restart = false,
	newDeviceId,
	updateSelection = false
}: UpdateDeviceOptions = {
	start: false,
	updateSelection: false
}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService }
) => {
	logger.debug('updatePreviewMic()');

	dispatch(meActions.setAudioInProgress(true));

	let track: MediaStreamTrack | undefined | null;

	try {
		const {
			autoGainControl,
			echoCancellation,
			noiseSuppression,
			sampleRate,
			channelCount,
			sampleSize,
		} = getState().settings;

		const deviceId = deviceService.getDeviceId(newDeviceId, 'audioinput');

		if (!deviceId) logger.warn('updatePreviewMic() no audio devices');

		if (restart) {
			const { previewMicTrackId } = getState().me;

			if (previewMicTrackId) {
				mediaService.previewMicTrack?.stop();
				mediaService.previewMicTrack = null;

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

		if (!track) throw new Error('no mic track');

		await deviceService.updateMediaDevices();

		if (updateSelection) {
			const { deviceId: trackDeviceId } = track.getSettings();

			dispatch(settingsActions.setSelectedAudioDevice(trackDeviceId));
		}

		mediaService.previewMicTrack = track;
		dispatch(meActions.setPreviewMicTrackId(track.id));
	} catch (error) {
		logger.error('updatePreviewMic() [error:%o]', error);
	} finally {
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
) => {
	logger.debug('stopPreviewMic()');

	dispatch(meActions.setAudioInProgress(true));

	const { previewMicTrackId } = getState().me;

	if (previewMicTrackId) {
		dispatch(meActions.setPreviewMicTrackId());

		mediaService.previewMicTrack?.stop();
		mediaService.previewMicTrack = null;
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
	start = false,
	newDeviceId,
	updateSelection = false
}: UpdateDeviceOptions = {
	start: false,
	updateSelection: false
}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService, effectsService }
) => {
	logger.debug('updatePreviewWebcam()');

	dispatch(meActions.setVideoInProgress(true));

	let track: MediaStreamTrack | undefined | null;

	try {
		const {
			aspectRatio,
			resolution,
			frameRate,
			blurEnabled,
		} = getState().settings;

		const deviceId = deviceService.getDeviceId(newDeviceId, 'videoinput');

		if (!deviceId)
			logger.warn('updatePreviewWebcam() no webcam devices');

		if (start && mediaService.previewWebcamTrack) {
			mediaService.previewWebcamTrack.stop();
			effectsService.stop(mediaService.previewWebcamTrack.id);
			mediaService.previewWebcamTrack = null;
			dispatch(meActions.setPreviewWebcamTrackId());
		}

		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				deviceId: { ideal: deviceId },
				...getVideoConstrains(resolution, aspectRatio),
				frameRate
			}
		});

		([ track ] = stream.getVideoTracks());

		if (!track) throw new Error('no webcam track');

		if (blurEnabled) track = await effectsService.applyEffect(track);

		await deviceService.updateMediaDevices();

		if (updateSelection) {
			const { deviceId: trackDeviceId } = track.getSettings();

			dispatch(settingsActions.setSelectedVideoDevice(trackDeviceId));
		}

		mediaService.previewWebcamTrack = track;
		dispatch(meActions.setPreviewWebcamTrackId(track.id));
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
) => {
	logger.debug('stopPreviewWebcam()');

	dispatch(meActions.setVideoInProgress(true));

	const { previewWebcamTrackId } = getState().me;

	if (previewWebcamTrackId) {
		const track = mediaService.previewWebcamTrack;

		dispatch(meActions.setPreviewWebcamTrackId());

		if (track) {
			track.stop();
			effectsService.stop(track.id);
			mediaService.previewWebcamTrack = null;
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
) => {
	logger.debug('updateAudioSettings()');

	dispatch(settingsActions.updateSettings(settings));
	dispatch(stopPreviewMic());
	dispatch(meActions.setMicEnabled(false));
	await dispatch(updateMic({ replace: true }));
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
	start = true,
	replace = false,
	enable = true,
	newDeviceId
}: UpdateDeviceOptions = {
	start: true,
	enable: true,
	replace: false
}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService }
) => {
	logger.debug('updateMic() [start:%s, newDeviceId:"%s"]', start, newDeviceId);

	dispatch(meActions.setAudioInProgress(true));

	let track: MediaStreamTrack | null = null;

	try {
		const canSendMic = getState().me.canSendMic;

		if (!canSendMic) throw new Error('cannot produce audio');
		if (newDeviceId && !start) throw new Error('changing device requires start');
		if (newDeviceId) dispatch(settingsActions.setSelectedAudioDevice(newDeviceId));

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

		if (start) {
			if (!replace) track = mediaService.mediaSenders['mic'].track;
			else track = mediaService.previewMicTrack;

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

				replace = mediaService.mediaSenders['mic'].running;
			}

			if (!track) throw new Error('no mic track');

			dispatch(meActions.setPreviewMicTrackId());

			mediaService.previewMicTrack = null;

			const { deviceId: trackDeviceId } = track.getSettings();

			dispatch(settingsActions.setSelectedAudioDevice(trackDeviceId));

			if (replace) {
				await mediaService.mediaSenders['mic'].replaceTrack(track);
			} else if (!mediaService.mediaSenders['mic'].running) {
				await mediaService.mediaSenders['mic'].start({
					track,
					stopTracks: false,
					disableTrackOnPause: false,
					zeroRtpOnPause: true,
					codecOptions: {
						opusStereo: opusStereo,
						opusFec: opusFec,
						opusDtx: opusDtx,
						opusMaxPlaybackRate: opusMaxPlaybackRate,
						opusPtime: opusPtime
					},
					appData: { source: 'mic' }
				});
			}
		} else {
			await mediaService.mediaSenders['mic'].track?.applyConstraints({
				sampleRate,
				channelCount,
				autoGainControl,
				echoCancellation,
				noiseSuppression,
				sampleSize
			});
		}

		if (enable) {
			dispatch(meActions.setAudioMuted(false));
			dispatch(meActions.setMicEnabled(true));
		}
	} catch (error) {
		logger.error('updateMic() [error:%o]', error);
	} finally {
		dispatch(meActions.setAudioInProgress(false));
	}
};

export const stopMic = (): AppThunk<void> => (
	dispatch,
	_getState,
	{ mediaService }
) => {
	logger.debug('stopMic()');

	mediaService.mediaSenders['mic'].stop();

	dispatch(meActions.setMicEnabled(false));
	dispatch(meActions.setAudioMuted(true));
};

export const pauseMic = (): AppThunk<void> => (
	dispatch,
	_getState,
	{ mediaService }
) => {
	logger.debug('pauseMic()');

	mediaService.mediaSenders['mic'].pause();

	dispatch(meActions.setAudioMuted(true));
};

export const resumeMic = (): AppThunk<void> => (
	dispatch,
	getState,
	{ mediaService }
) => {
	logger.debug('resumeMic()');

	mediaService.mediaSenders['mic'].resume();

	dispatch(meActions.setAudioMuted(false));
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
): AppThunk<Promise<void>> => async (
	dispatch,
	getState
) => {
	logger.debug('updateVideoSettings()');

	const webcamEnabled = getState().me.webcamEnabled;

	dispatch(settingsActions.updateSettings(settings));
	dispatch(meActions.setWebcamEnabled(false));
	if (webcamEnabled) await dispatch(updateWebcam({ replace: true }));
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
	start = true,
	enable = true,
	replace = false,
	newDeviceId,
}: UpdateDeviceOptions = {
	start: true,
	enable: true,
	replace: false,
}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService, effectsService, config }
) => {
	logger.debug('updateWebcam [start:%s, newDeviceId:%s]', start, newDeviceId);

	dispatch(meActions.setVideoInProgress(true));

	let track: MediaStreamTrack | null = null;

	try {
		const canSendWebcam = getState().me.canSendWebcam;

		if (!canSendWebcam) throw new Error('cannot produce video');
		if (newDeviceId && !start) throw new Error('changing device requires start');
		if (newDeviceId) dispatch(settingsActions.setSelectedVideoDevice(newDeviceId));

		const {
			aspectRatio,
			resolution,
			frameRate,
			selectedVideoDevice,
			blurEnabled,
		} = getState().settings;
		
		const deviceId = deviceService.getDeviceId(selectedVideoDevice, 'videoinput');

		if (!deviceId) logger.warn('no webcam devices');

		if (start) {
			if (!replace) track = mediaService.mediaSenders['webcam'].track;
			else track = mediaService.previewWebcamTrack;

			if (!track) {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						deviceId: { ideal: deviceId },
						...getVideoConstrains(resolution, aspectRatio),
						frameRate
					}
				});
	
				([ track ] = stream.getVideoTracks());

				replace = mediaService.mediaSenders['webcam'].running;
			}

			if (!track) throw new Error('no webcam track');

			dispatch(meActions.setPreviewWebcamTrackId());

			mediaService.previewWebcamTrack = null;

			const { deviceId: trackDeviceId, width, height } = track.getSettings();

			if (blurEnabled && replace) track = await effectsService.applyEffect(track);

			// User may have chosen a different device than the one initially selected
			// so we need to update the selected device in the settings just in case
			dispatch(settingsActions.setSelectedVideoDevice(trackDeviceId));

			if (replace) {
				if (mediaService.mediaSenders['webcam'].track)
					effectsService.stop(mediaService.mediaSenders['webcam'].track.id);

				await mediaService.mediaSenders['webcam'].replaceTrack(track);
			} else if (!mediaService.mediaSenders['webcam'].running) {
				if (config.simulcast) {
					const encodings = getEncodings(width, height);
	
					await mediaService.mediaSenders['webcam'].start({
						track,
						stopTracks: false,
						disableTrackOnPause: false,
						zeroRtpOnPause: true,
						encodings,
						codecOptions: {
							videoGoogleStartBitrate: 1000
						},
						appData: { source: 'webcam' }
					}, 'video/h264');
				} else {
					await mediaService.mediaSenders['webcam'].start({
						track,
						stopTracks: false,
						disableTrackOnPause: false,
						zeroRtpOnPause: true,
						appData: { source: 'webcam' }
					}, 'video/h264');
				}
			}
		} else {
			await mediaService.mediaSenders['webcam'].track?.applyConstraints({
				...getVideoConstrains(resolution, aspectRatio),
				frameRate
			});

			await mediaService.mediaSenders['extravideo'].track?.applyConstraints({
				...getVideoConstrains(resolution, aspectRatio),
				frameRate
			});
		}

		if (enable) {
			dispatch(meActions.setVideoMuted(false));
			dispatch(meActions.setWebcamEnabled(true));
		}
	} catch (error) {
		logger.error('updateWebcam() [error:%o]', error);
	} finally {
		dispatch(meActions.setVideoInProgress(false));
	}
};

export const stopWebcam = (): AppThunk<void> => (
	dispatch,
	_getState,
	{ mediaService, effectsService }
): void => {
	logger.debug('stopWebcam()');

	if (mediaService.mediaSenders['webcam'].track)
		effectsService.stop(mediaService.mediaSenders['webcam'].track.id);

	mediaService.mediaSenders['webcam'].stop();

	dispatch(meActions.setWebcamEnabled(false));
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
): AppThunk<Promise<void>> => async (
	dispatch,
	getState
) => {
	logger.debug('updateVideoSettings()');

	const screenEnabled = getState().me.screenEnabled;

	dispatch(settingsActions.updateSettings(settings));
	dispatch(meActions.setScreenEnabled(false));
	if (screenEnabled) await dispatch(updateScreenSharing({ replace: true }));
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
	start = true,
	replace = false,
	enable = true,
}: UpdateDeviceOptions = {
	start: true,
	replace: false,
	enable: true
}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, config }
) => {
	logger.debug('updateScreenSharing() [start:%s]', start);

	dispatch(meActions.setScreenSharingInProgress(true));

	let audioTrack: MediaStreamTrack | null = null;
	let videoTrack: MediaStreamTrack | null = null;
	let stream: MediaStream | undefined;

	try {
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

		if (start) {
			if (!replace) videoTrack = mediaService.mediaSenders['screen'].track;

			if (!videoTrack) {
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

				stream = await navigator.mediaDevices.getDisplayMedia(SCREENSHARE_CONSTRAINTS);

				([ videoTrack ] = stream.getVideoTracks());

				replace = mediaService.mediaSenders['screen'].running;
			}

			if (!videoTrack) throw new Error('no screen track');

			const { width, height } = videoTrack.getSettings();

			if (replace) {
				await mediaService.mediaSenders['screen'].replaceTrack(videoTrack);
			} else if (!mediaService.mediaSenders['screen'].running) {
				if (config.simulcastSharing) {
					const encodings = getEncodings(width, height, false, true);

					await mediaService.mediaSenders['screen'].start({
						track: videoTrack,
						stopTracks: false,
						disableTrackOnPause: false,
						zeroRtpOnPause: true,
						encodings,
						codecOptions: {
							videoGoogleStartBitrate: 1000
						},
						appData: { source: 'screen' }
					}, 'video/h264');
				} else {
					await mediaService.mediaSenders['screen'].start({
						track: videoTrack,
						stopTracks: false,
						disableTrackOnPause: false,
						zeroRtpOnPause: true,
						codecOptions: {
							videoGoogleStartBitrate: 1000
						},
						appData: { source: 'screen' }
					}, 'video/h264');
				}
			}

			if (enable) dispatch(meActions.setScreenEnabled(true));

			if (!replace) audioTrack = mediaService.mediaSenders['screenaudio'].track;

			if (!audioTrack && stream) {
				([ audioTrack ] = stream.getAudioTracks());

				replace = mediaService.mediaSenders['screenaudio'].running;
			}

			if (audioTrack) {
				if (replace) {
					await mediaService.mediaSenders['screenaudio'].replaceTrack(audioTrack);
				} else if (!mediaService.mediaSenders['screenaudio'].running) {
					await mediaService.mediaSenders['screenaudio'].start({
						track: audioTrack,
						stopTracks: false,
						disableTrackOnPause: false,
						zeroRtpOnPause: true,
						codecOptions: {
							opusStereo: opusStereo,
							opusFec: opusFec,
							opusDtx: opusDtx,
							opusMaxPlaybackRate: opusMaxPlaybackRate,
							opusPtime: opusPtime
						},
						appData: { source: 'screenaudio' }
					});
				}

				if (enable) dispatch(meActions.setScreenAudioEnabled(true));
			}
		} else {
			await mediaService.mediaSenders['screen'].track?.applyConstraints({
				...getVideoConstrains(screenSharingResolution, aspectRatio),
				frameRate: screenSharingFrameRate
			});

			await mediaService.mediaSenders['screenaudio'].track?.applyConstraints({
				sampleRate,
				channelCount,
				autoGainControl,
				echoCancellation,
				noiseSuppression,
				sampleSize
			});
		}
	} catch (error) {
		logger.error('updateScreenSharing() [error:%o]', error);
	} finally {
		dispatch(meActions.setScreenSharingInProgress(false));
	}
};

export const stopScreenSharing = (): AppThunk<void> => (
	dispatch,
	_getState,
	{ mediaService }
) => {
	logger.debug('stopScreenSharing()');

	mediaService.mediaSenders['screen'].stop();

	dispatch(meActions.setScreenEnabled(false));
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
	start = true,
	replace = false,
	enable = true,
	newDeviceId
}: UpdateDeviceOptions = {
	start: true,
	replace: false,
	enable: true
}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService, config, effectsService }
) => {
	logger.debug('startExtraVideo [newDeviceId:%s]', newDeviceId);

	dispatch(meActions.setVideoInProgress(true));

	let track: MediaStreamTrack | null = null;

	try {
		const canSendWebcam = getState().me.canSendWebcam;

		if (!canSendWebcam) throw new Error('cannot produce video');

		const {
			aspectRatio,
			resolution,
			frameRate,
			blurEnabled,
		} = getState().settings;
		
		const deviceId = deviceService.getDeviceId(newDeviceId, 'videoinput');

		if (!deviceId) logger.warn('no extravideo device');

		if (start) {
			if (!replace) track = mediaService.mediaSenders['extravideo'].track;

			if (!track) {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						deviceId: { ideal: deviceId },
						...getVideoConstrains(resolution, aspectRatio),
						frameRate,
					}
				});

				([ track ] = stream.getVideoTracks());

				replace = mediaService.mediaSenders['extravideo'].running;
			}

			if (!track) throw new Error('no webcam track');

			const { width, height } = track.getSettings();

			if (blurEnabled && replace) track = await effectsService.applyEffect(track);

			if (replace) {
				if (mediaService.mediaSenders['extravideo'].track)
					effectsService.stop(mediaService.mediaSenders['extravideo'].track.id);

				await mediaService.mediaSenders['extravideo'].replaceTrack(track);
			} else if (!mediaService.mediaSenders['extravideo'].running) {
				if (config.simulcast) {
					const encodings = getEncodings(width, height);

					await mediaService.mediaSenders['extravideo'].start({
						track,
						stopTracks: false,
						disableTrackOnPause: false,
						zeroRtpOnPause: true,
						encodings,
						codecOptions: {
							videoGoogleStartBitrate: 1000
						},
						appData: { source: 'extravideo' }
					}, 'video/h264');
				} else {
					await mediaService.mediaSenders['extravideo'].start({
						track,
						stopTracks: false,
						disableTrackOnPause: false,
						zeroRtpOnPause: true,
						appData: { source: 'extravideo' }
					}, 'video/h264');
				}
			}
		} else {
			await mediaService.mediaSenders['extravideo'].track?.applyConstraints({
				...getVideoConstrains(resolution, aspectRatio),
				frameRate
			});
		}

		if (enable) dispatch(meActions.setExtraVideoEnabled(true));
	} catch (error) {
		logger.error('startExtraVideo() [error:%o]', error);
	} finally {
		dispatch(meActions.setVideoInProgress(false));
	}
};

export const stopExtraVideo = (): AppThunk<void> => (
	dispatch,
	_getState,
	{ mediaService }
) => {
	logger.debug('stopExtraVideo()');

	mediaService.mediaSenders['extravideo'].stop();

	dispatch(meActions.setExtraVideoEnabled(false));
};
