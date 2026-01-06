import { getEncodings, getVideoConstrains } from '../../utils/encodingsHandler';
import { BackgroundConfig, BackgroundType, Resolution } from '../../utils/types';
import { meActions } from '../slices/meSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppThunk } from '../store';
import { roomActions } from '../slices/roomSlice';
import { Logger } from '../../utils/Logger';
import { ImageKeys } from '../../services/clientImageService';
import { notificationsActions } from '../slices/notificationsSlice';

const logger = new Logger('MediaActions');

type MediaKind = 'camera' | 'microphone' | 'screen';

// eslint-disable-next-line no-unused-var
function showMediaErrorToast(
	dispatch: (...args: unknown[]) => unknown,
	error: unknown,
	kind: MediaKind
): boolean {
	const enqueueToast = (message: string, variant: 'error' | 'info'): void => {
		dispatch(
			notificationsActions.enqueueNotification({
				message,
				options: { variant }
			})
		);
	};

	let name: string | undefined;
	let message: string | undefined;
	let constraint: string | undefined;

	if (error instanceof DOMException) {
		name = error.name;
		message = error.message;

		const maybeConstraint = (error as unknown as { constraint?: unknown }).constraint;

		if (typeof maybeConstraint === 'string') constraint = maybeConstraint;
	} else if (typeof error === 'string') {
		message = error;
	} else if (error && typeof error === 'object') {
		const obj = error as Record<string, unknown>;

		if (typeof obj.name === 'string') name = obj.name;

		if (typeof obj.message === 'string') message = obj.message;

		if (typeof obj.constraint === 'string') constraint = obj.constraint;
	}

	// User cancelled / denied
	if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
		if (kind === 'screen') {
			enqueueToast('Screen sharing cancelled.', 'info');

			return true;
		}

		enqueueToast('Permission denied. Please allow access in your browser settings.', 'error');

		return true;
	}

	// Some browsers use AbortError for cancelling screenshare picker
	if (kind === 'screen' && name === 'AbortError') {
		enqueueToast('Screen sharing cancelled.', 'info');

		return true;
	}

	// Device/capture busy or cannot start
	if (name === 'NotReadableError' || name === 'TrackStartError') {
		const what = kind === 'microphone' ? 'Microphone' : kind === 'camera' ? 'Camera' : 'Screen sharing';

		enqueueToast(`${what} is already in use or could not start.`, 'error');

		return true;
	}

	// No device / no sources
	if (name === 'NotFoundError') {
		const what = kind === 'microphone' ? 'microphone' : kind === 'camera' ? 'camera' : 'screen source';

		enqueueToast(`No ${what} found.`, 'error');

		return true;
	}

	// Constraints can’t be satisfied (often stale deviceId)
	if (name === 'OverconstrainedError') {
		const details = constraint ? ` (constraint: ${constraint})` : '';

		enqueueToast(`Selected device/settings can’t be satisfied. Try selecting a different device.${details}`, 'error');

		return true;
	}

	// Fallback
	if (message && message.trim().length > 0) {
		enqueueToast(message, 'error');

		return true;
	}

	return false;
}

interface UpdateDeviceOptions {
	newDeviceId?: string;
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
}

interface ScreenshareSettings {
	screenSharingResolution?: Resolution;
	screenSharingFrameRate?: number;
}

let hasInitalAudioUpdatedDevices = false;
let hasPostAudioUpdatedDevices = false;
let hasInitalVideoUpdatedDevices = false;
let hasPostVideoUpdatedDevices = false;

let initialUpdateDevicesPromise: Promise<void> | undefined;
let postUpdateDevicesPromise: Promise<void> | undefined;

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
	newDeviceId,
	updateSelection = false
}: UpdateDeviceOptions = {
	updateSelection: false
}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService }
) => {
	logger.debug('updatePreviewMic()');

	dispatch(meActions.setAudioInProgress(true));

	let track: MediaStreamTrack | undefined | null;
	const replace = Boolean(mediaService.previewMicTrack);

	try {
		const {
			autoGainControl,
			echoCancellation,
			noiseSuppression,
			sampleRate,
			channelCount,
			sampleSize,
		} = getState().settings;

		if (!hasInitalAudioUpdatedDevices) {
			initialUpdateDevicesPromise = deviceService.updateMediaDevices();
			hasInitalAudioUpdatedDevices = true;

			await initialUpdateDevicesPromise;
		}

		const deviceId = deviceService.getDeviceId(newDeviceId, 'audioinput');

		if (!deviceId) logger.warn('updatePreviewMic() no audio devices');

		if (replace) {
			const { previewMicTrackId } = getState().me;

			if (previewMicTrackId) {
				mediaService.previewMicTrack?.stop();
				mediaService.previewMicTrack = null;

				dispatch(meActions.setPreviewMicTrackId());
			}
		}

		const stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				deviceId: { exact: deviceId },
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

		if (!hasPostAudioUpdatedDevices) {
			postUpdateDevicesPromise = deviceService.updateMediaDevices();
			hasPostAudioUpdatedDevices = true;

			await postUpdateDevicesPromise;
		}

		if (updateSelection) {
			const { deviceId: trackDeviceId } = track.getSettings();

			dispatch(settingsActions.setSelectedAudioDevice(trackDeviceId));
		}

		mediaService.previewMicTrack = track;
		dispatch(meActions.setPreviewMicTrackId(track.id));
	} catch (error) {
		logger.error('updatePreviewMic() [error:%o]', error);
		showMediaErrorToast(dispatch, error, 'microphone');

		deviceService.updateMediaDevices();

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
	newDeviceId,
	updateSelection = false
}: UpdateDeviceOptions = {
	updateSelection: false
}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService, effectsService }
) => {
	logger.debug('updatePreviewWebcam()');

	dispatch(meActions.setVideoInProgress(true));

	let track: MediaStreamTrack | undefined | null;
	const replace = Boolean(mediaService.previewWebcamTrack);

	try {
		const {
			aspectRatio,
			resolution,
			frameRate,
		} = getState().settings;

		if (!hasInitalVideoUpdatedDevices) {
			initialUpdateDevicesPromise = deviceService.updateMediaDevices();
			hasInitalVideoUpdatedDevices = true;

			await initialUpdateDevicesPromise;
		}

		const deviceId = deviceService.getDeviceId(newDeviceId, 'videoinput');

		if (!deviceId)
			logger.warn('updatePreviewWebcam() no webcam devices');

		if (replace) {
			mediaService.previewWebcamTrack?.stop();
			effectsService.stop(mediaService.previewWebcamTrack?.id);
			mediaService.previewWebcamTrack = null;
			dispatch(meActions.setPreviewWebcamTrackId());
		}

		const lastSelectedVideoDevice = deviceService.getDeviceId(getState().settings.selectedVideoDevice, 'videoinput');

		let videoOptions = {
			deviceId: { exact: deviceId },
			...getVideoConstrains(resolution, aspectRatio),
			frameRate
		};

		if (!newDeviceId && lastSelectedVideoDevice) {
			videoOptions = {
				deviceId: { exact: lastSelectedVideoDevice },
				...getVideoConstrains(resolution, aspectRatio),
				frameRate
			};
		}

		const stream = await navigator.mediaDevices.getUserMedia({
			video: videoOptions
		});

		([ track ] = stream.getVideoTracks());

		if (!track) throw new Error('no webcam track');

		if (updateSelection) {
			const { deviceId: trackDeviceId } = track.getSettings();

			dispatch(settingsActions.setSelectedVideoDevice(trackDeviceId));
		}

		const { videoBackgroundEffect } = getState().me;

		if (videoBackgroundEffect && videoBackgroundEffect?.type !== BackgroundType.NONE) {
			track = await effectsService.applyEffect(track, videoBackgroundEffect);
		}

		if (!hasPostVideoUpdatedDevices) {
			postUpdateDevicesPromise = deviceService.updateMediaDevices();
			hasPostVideoUpdatedDevices = true;

			await postUpdateDevicesPromise;
		}

		mediaService.previewWebcamTrack = track;
		dispatch(meActions.setPreviewWebcamTrackId(track.id));
	} catch (error) {
		logger.error('updatePreviewWebcam() [error:%o]', error);
		showMediaErrorToast(dispatch, error, 'camera');
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
	dispatch,
	getState
) => {
	logger.debug('updateAudioSettings()');

	const micEnabled = getState().me.micEnabled;

	dispatch(settingsActions.updateSettings(settings));
	dispatch(meActions.setMicEnabled(false));
	dispatch(stopMic());

	if (micEnabled) await dispatch(updateMic());
};

/**
 * This thunk action starts/restarts the main audio track.
 * It will use the MediaService to create the Producer from it
 * which will send it to the server.
 * 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const updateMic = ({ newDeviceId }: UpdateDeviceOptions = {}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService }
) => {
	logger.debug('updateMic() [newDeviceId:%s]', newDeviceId);

	dispatch(meActions.setAudioInProgress(true));

	const start = !mediaService.mediaSenders['mic'].running;
	const replace = mediaService.mediaSenders['mic'].running && Boolean(newDeviceId);

	let track: MediaStreamTrack | null = null;

	try {
		const canSendMic = getState().me.canSendMic;

		if (!canSendMic) throw new Error('cannot produce audio');
		if (newDeviceId) dispatch(settingsActions.setSelectedAudioDevice(newDeviceId));

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

		if (start || replace) {
			if (start) track = mediaService.previewMicTrack;

			if (!track) {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: {
						deviceId: { exact: deviceId },
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

			const isPreview = track === mediaService.previewMicTrack;

			// If we are taking the preview track we need to remove it from the media service
			if (isPreview) mediaService.previewMicTrack = null;

			const { deviceId: trackDeviceId } = track.getSettings();

			dispatch(settingsActions.setSelectedAudioDevice(trackDeviceId));

			if (mediaService.mediaSenders['mic'].running) {
				await mediaService.mediaSenders['mic'].replaceTrack(track);
			} else {
				await mediaService.mediaSenders['mic'].start({
					track,
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

		dispatch(meActions.setAudioMuted(false));
		dispatch(meActions.setMicEnabled(true));
	} catch (error) {
		logger.error('updateMic() [error:%o]', error);
		showMediaErrorToast(dispatch, error, 'microphone');
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
	_getState,
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
export const updateVideoSettings = (settings: VideoSettings = {}): AppThunk<Promise<void>> => async (
	dispatch,
	getState
) => {
	logger.debug('updateVideoSettings()');

	const webcamEnabled = getState().me.webcamEnabled;
	const havePreviewWebcam = Boolean(getState().me.previewWebcamTrackId);

	dispatch(settingsActions.updateSettings(settings));
	dispatch(meActions.setWebcamEnabled(false));
	dispatch(stopPreviewWebcam());
	dispatch(stopWebcam());

	if (webcamEnabled) await dispatch(updateWebcam());
	if (havePreviewWebcam) await dispatch(updatePreviewWebcam());
};

/**
 * This thunk action starts/restarts the main video track.
 * It will use the MediaService to create the Producer from it
 * which will send it to the server.
 * 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const updateWebcam = ({ newDeviceId }: UpdateDeviceOptions = {}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService, effectsService, config }
) => {
	logger.debug('updateWebcam [newDeviceId:%s]', newDeviceId);

	dispatch(meActions.setVideoInProgress(true));

	const start = !mediaService.mediaSenders['webcam'].running;
	const replace = mediaService.mediaSenders['webcam'].running && Boolean(newDeviceId);

	let track: MediaStreamTrack | null = null;

	try {
		const canSendWebcam = getState().me.canSendWebcam;

		if (!canSendWebcam) throw new Error('cannot produce video');
		if (newDeviceId) dispatch(settingsActions.setSelectedVideoDevice(newDeviceId));

		const {
			aspectRatio,
			resolution,
			frameRate,
			selectedVideoDevice,
		} = getState().settings;

		const deviceId = deviceService.getDeviceId(selectedVideoDevice, 'videoinput');

		if (!deviceId) logger.warn('no webcam devices');

		if (start || replace) {
			if (start) track = mediaService.previewWebcamTrack;

			if (!track) {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						deviceId: { exact: deviceId },
						...getVideoConstrains(resolution, aspectRatio),
						frameRate
					}
				});

				([ track ] = stream.getVideoTracks());
			}

			if (!track) throw new Error('no webcam track');

			dispatch(meActions.setPreviewWebcamTrackId());

			const isPreview = track === mediaService.previewWebcamTrack;
			const inputTrack = effectsService.effectTracks.get(track.id)?.inputTrack;

			const { deviceId: trackDeviceId, width, height } = inputTrack?.getSettings() ?? track.getSettings();

			const { videoBackgroundEffect } = getState().me;

			if (videoBackgroundEffect && videoBackgroundEffect?.type !== BackgroundType.NONE && !inputTrack) {
				track = await effectsService.applyEffect(track, videoBackgroundEffect);
			}

			// If we are taking the preview track we need to remove it from the media service
			if (isPreview) mediaService.previewWebcamTrack = null;

			// User may have chosen a different device than the one initially selected
			// so we need to update the selected device in the settings just in case
			dispatch(settingsActions.setSelectedVideoDevice(trackDeviceId));

			if (mediaService.mediaSenders['webcam'].running) {
				effectsService.stop(mediaService.mediaSenders['webcam'].track?.id);

				await mediaService.mediaSenders['webcam'].replaceTrack(track);
			} else if (config.simulcast) {
				const encodings = getEncodings(width, height);

				await mediaService.mediaSenders['webcam'].start({
					track,
					zeroRtpOnPause: true,
					encodings,
					codecOptions: { videoGoogleStartBitrate: 1000 },
					appData: { source: 'webcam' }
				});
			} else {
				await mediaService.mediaSenders['webcam'].start({
					track,
					zeroRtpOnPause: true,
					appData: { source: 'webcam' }
				});
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

		dispatch(meActions.setVideoMuted(false));
		dispatch(meActions.setWebcamEnabled(true));
	} catch (error) {
		logger.error('updateWebcam() [error:%o]', error);
		showMediaErrorToast(dispatch, error, 'camera');
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

	effectsService.stop(mediaService.mediaSenders['webcam'].track?.id);
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

	if (screenEnabled) await dispatch(updateScreenSharing());
};

/**
 * This thunk action starts/restarts the main screen sharing track.
 * It will use the MediaService to create the Producer from it
 * which will send it to the server.
 * 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const updateScreenSharing = (): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, config }
) => {
	logger.debug('updateScreenSharing()');

	dispatch(meActions.setScreenSharingInProgress(true));

	let audioTrack: MediaStreamTrack | null = null;
	let videoTrack: MediaStreamTrack | null = null;
	let stream: MediaStream | undefined;

	const start = !mediaService.mediaSenders['screen'].running;

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

			if (!videoTrack) throw new Error('no screen track');

			const { width, height } = videoTrack.getSettings();

			if (config.simulcastSharing) {
				const encodings = getEncodings(width, height, false, true);

				await mediaService.mediaSenders['screen'].start({
					track: videoTrack,
					zeroRtpOnPause: true,
					encodings,
					codecOptions: {
						videoGoogleStartBitrate: 1000
					},
					appData: { source: 'screen' }
				});
			} else {
				await mediaService.mediaSenders['screen'].start({
					track: videoTrack,
					zeroRtpOnPause: true,
					codecOptions: {
						videoGoogleStartBitrate: 1000
					},
					appData: { source: 'screen' }
				});
			}

			dispatch(meActions.setScreenEnabled(true));

			([ audioTrack ] = stream.getAudioTracks());

			if (audioTrack) {
				await mediaService.mediaSenders['screenaudio'].start({
					track: audioTrack,
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

				dispatch(meActions.setScreenAudioEnabled(true));
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
		showMediaErrorToast(dispatch, error, 'screen');
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
	mediaService.mediaSenders['screenaudio'].stop();
	dispatch(meActions.setScreenEnabled(false));
	dispatch(meActions.setScreenAudioEnabled(false));
};

/**
 * This thunk action starts and extra video track.
 * It will use the MediaService to create the Producer from it
 * which will send it to the server.
 * 
 * @param options - Options.
 * @returns {Promise<void>} Promise.
 */
export const startExtraVideo = ({ newDeviceId }: UpdateDeviceOptions = {}): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ mediaService, deviceService, config, effectsService }
) => {
	logger.debug('startExtraVideo [newDeviceId:%s]', newDeviceId);

	dispatch(meActions.setVideoInProgress(true));

	const start = !mediaService.mediaSenders['extravideo'].running;
	const replace = mediaService.mediaSenders['extravideo'].running && Boolean(newDeviceId);

	let track: MediaStreamTrack | null = null;

	try {
		const canSendWebcam = getState().me.canSendWebcam;

		if (!canSendWebcam) throw new Error('cannot produce video');

		const {
			aspectRatio,
			resolution,
			frameRate,
		} = getState().settings;

		const deviceId = deviceService.getDeviceId(newDeviceId, 'videoinput');

		if (!deviceId) logger.warn('no extravideo device');

		if (start || replace) {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					deviceId: { exact: deviceId },
					...getVideoConstrains(resolution, aspectRatio),
					frameRate,
				}
			});

			([ track ] = stream.getVideoTracks());

			if (!track) throw new Error('no webcam track');

			const { width, height } = track.getSettings();

			const { videoBackgroundEffect } = getState().me;

			if (videoBackgroundEffect && videoBackgroundEffect?.type !== BackgroundType.NONE) {
				track = await effectsService.applyEffect(track, videoBackgroundEffect);
			}

			if (mediaService.mediaSenders['extravideo'].running) {
				if (mediaService.mediaSenders['extravideo'].track)
					effectsService.stop(mediaService.mediaSenders['extravideo'].track.id);

				await mediaService.mediaSenders['extravideo'].replaceTrack(track);
			} else if (config.simulcast) {
				const encodings = getEncodings(width, height);

				await mediaService.mediaSenders['extravideo'].start({
					track,
					zeroRtpOnPause: true,
					encodings,
					codecOptions: { videoGoogleStartBitrate: 1000 },
					appData: { source: 'extravideo' }
				});
			} else {
				await mediaService.mediaSenders['extravideo'].start({
					track,
					zeroRtpOnPause: true,
					appData: { source: 'extravideo' }
				});
			}
		} else {
			await mediaService.mediaSenders['extravideo'].track?.applyConstraints({
				...getVideoConstrains(resolution, aspectRatio),
				frameRate
			});
		}

		dispatch(meActions.setExtraVideoEnabled(true));
	} catch (error) {
		logger.error('startExtraVideo() [error:%o]', error);
		showMediaErrorToast(dispatch, error, 'camera');
	} finally {
		dispatch(meActions.setVideoInProgress(false));
	}
};

export const stopExtraVideo = (): AppThunk<void> => (
	dispatch,
	_getState,
	{ mediaService, effectsService }
) => {
	logger.debug('stopExtraVideo()');

	effectsService.stop(mediaService.mediaSenders['extravideo'].track?.id);
	mediaService.mediaSenders['extravideo'].stop();
	dispatch(meActions.setExtraVideoEnabled(false));
};

/**
 * Loads user's video background from persistent storage into memory.
 * This is needed since image has to be loaded in the same security context in order to not be blocked.
 */
export const loadVideoBackground = (
): AppThunk<Promise<void>> => async (dispatch, getState, { clientImageService }) => {
	const videoBackground = await clientImageService.loadEarmarkedImage(ImageKeys.VIDEO_BACKGROUND);
	const backgroundEnabled = getState().me.videoBackgroundEffect?.type === BackgroundType.IMAGE;

	if (videoBackground && backgroundEnabled) {
		const videoBackgroundEffect: BackgroundConfig = {
			type: BackgroundType.IMAGE,
			url: videoBackground,
		};

		dispatch(meActions.setVideoBackgroundEffect(videoBackgroundEffect));
	} else {
		dispatch(meActions.setVideoBackgroundEffectDisabled());
	}
};

/**
 * Set user's video background from persistent storage into memory.
 */
export const setVideoBackground = (
	imageName: string,
): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ clientImageService }
) => {
	await clientImageService.setEarmarkedImage(imageName, ImageKeys.VIDEO_BACKGROUND);
	const imageUrl: string | null = await clientImageService.getEarmarkedImage(ImageKeys.VIDEO_BACKGROUND);

	if (imageUrl) {
		const videoBackgroundEffect: BackgroundConfig = {
			type: BackgroundType.IMAGE,
			url: imageUrl,
		};

		dispatch(meActions.setVideoBackgroundEffect(videoBackgroundEffect));
	} else {
		dispatch(meActions.setVideoBackgroundEffectDisabled());
	}
	dispatch(updateVideoSettings());
};
