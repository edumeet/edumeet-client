import { Logger } from 'edumeet-common';
import { getEncodings, getVideoConstrains } from '../../utils/encodingsHandler';
import { Resolution } from '../../utils/types';
import { meActions } from '../slices/meSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppThunk } from '../store';
import { roomActions } from '../slices/roomSlice';
import { p2pModeSelector, peersArraySelector } from '../selectors';

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
				mediaService.previewMicTrack = undefined;

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
		mediaService.previewMicTrack = undefined;
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
			mediaService.previewWebcamTrack = undefined;
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
			mediaService.previewWebcamTrack = undefined;
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

	let track: MediaStreamTrack | undefined;

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
			if (!replace) track = mediaService.tracks['mic'];
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

				replace = true;
			}

			if (!track) throw new Error('no mic track');

			dispatch(meActions.setPreviewMicTrackId());

			mediaService.previewMicTrack = undefined;

			const { deviceId: trackDeviceId } = track.getSettings();

			dispatch(settingsActions.setSelectedAudioDevice(trackDeviceId));

			if (mediaService.producers['mic'] && replace) {
				await mediaService.producers['mic'].replaceTrack({ track });
			} else if (!mediaService.producers['mic']) {
				mediaService.producers['mic'] = await mediaService.produce('mic', {
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

			if (replace) {
				for (const micPeerProducer of mediaService.peerProducers['mic'].values()) {
					await micPeerProducer.replaceTrack({ track });
				}
			}

			if (!p2pModeSelector(getState())) {
				if (!getState().me.audioMuted) mediaService.producers['mic']?.resume();

				for (const peerProducer of mediaService.peerProducers['mic'].values()) {
					peerProducer.close();
				}
			} else {
				for (const peer of peersArraySelector(getState())) {
					if (!mediaService.peerProducers['mic'].has(peer.id)) {
						const producer = await mediaService.peerProduce(peer.id, 'mic', {
							track,
							stopTracks: false,
							disableTrackOnPause: false,
							zeroRtpOnPause: true,
							appData: { source: 'mic' }
						});

						if (getState().me.audioMuted) producer.pause();
					}
				}

				mediaService.producers['mic']?.pause();
			}

			if (replace) {
				mediaService.tracks['mic']?.stop();
				mediaService.tracks['mic'] = track;
			}
		} else {
			await mediaService.tracks['mic']?.applyConstraints({
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

	mediaService.closeProducer('mic', true);

	for (const peerProducer of mediaService.peerProducers['mic'].values()) {
		peerProducer.close();
	}

	dispatch(meActions.setMicEnabled(false));
	dispatch(meActions.setAudioMuted(true));

	mediaService.tracks['mic']?.stop();
	mediaService.tracks['mic'] = undefined;
};

export const pauseMic = (): AppThunk<void> => (
	dispatch,
	_getState,
	{ mediaService }
) => {
	logger.debug('pauseMic()');

	mediaService.producers['mic']?.pause();

	for (const peerProducer of mediaService.peerProducers['mic'].values()) {
		peerProducer.pause();
	}

	dispatch(meActions.setAudioMuted(true));
};

export const resumeMic = (): AppThunk<void> => (
	dispatch,
	getState,
	{ mediaService }
) => {
	logger.debug('resumeMic()');

	if (!p2pModeSelector(getState())) {
		mediaService.producers['mic']?.resume();
	} else {
		for (const peerProducer of mediaService.peerProducers['mic'].values()) {
			peerProducer.resume();
		}
	}

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

	let track: MediaStreamTrack | undefined;

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
			if (!replace) track = mediaService.tracks['webcam'];
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

				replace = true;
			}

			if (!track) throw new Error('no webcam track');

			dispatch(meActions.setPreviewWebcamTrackId());

			mediaService.previewWebcamTrack = undefined;

			const { deviceId: trackDeviceId, width, height } = track.getSettings();

			if (blurEnabled && replace) track = await effectsService.applyEffect(track);

			// User may have chosen a different device than the one initially selected
			// so we need to update the selected device in the settings just in case
			dispatch(settingsActions.setSelectedVideoDevice(trackDeviceId));

			if (mediaService.producers['webcam'] && replace) {
				await mediaService.producers['webcam'].replaceTrack({ track });
			} else if (!mediaService.producers['webcam']) {
				if (config.simulcast) {
					const encodings = getEncodings(width, height);
	
					await mediaService.produce('webcam', {
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
					await mediaService.produce('webcam', {
						track,
						stopTracks: false,
						disableTrackOnPause: false,
						zeroRtpOnPause: true,
						appData: { source: 'webcam' }
					}, 'video/h264');
				}
			}

			if (replace) {
				for (const webcamPeerProducer of mediaService.peerProducers['webcam'].values()) {
					await webcamPeerProducer.replaceTrack({ track });
				}
			}

			if (!p2pModeSelector(getState())) {
				mediaService.producers['webcam']?.resume();

				for (const peerProducer of mediaService.peerProducers['webcam'].values()) {
					peerProducer.close();
				}
			} else {
				for (const peer of peersArraySelector(getState())) {
					if (!mediaService.peerProducers['webcam'].has(peer.id)) {
						await mediaService.peerProduce(peer.id, 'webcam', {
							track,
							stopTracks: false,
							disableTrackOnPause: false,
							zeroRtpOnPause: true,
							appData: { source: 'webcam' }
						});
					}
				}

				mediaService.producers['webcam']?.pause();
			}

			if (replace && mediaService.tracks['webcam']) {
				effectsService.stop(mediaService.tracks['webcam'].id);
				mediaService.tracks['webcam'].stop();
			}

			mediaService.tracks['webcam'] = track;
		} else {
			await mediaService.tracks['webcam']?.applyConstraints({
				...getVideoConstrains(resolution, aspectRatio),
				frameRate
			});

			await mediaService.tracks['extravideo']?.applyConstraints({
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

	mediaService.closeProducer('webcam', true);

	for (const peerProducer of mediaService.peerProducers['webcam'].values()) {
		peerProducer.close();
	}

	dispatch(meActions.setWebcamEnabled(false));

	if (mediaService.tracks['webcam']) {
		effectsService.stop(mediaService.tracks['webcam'].id);
		mediaService.tracks['webcam'].stop();
		mediaService.tracks['webcam'] = undefined;
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

	let audioTrack: MediaStreamTrack | undefined;
	let videoTrack: MediaStreamTrack | undefined;
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
			if (!replace) videoTrack = mediaService.tracks['screen'];

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

				replace = true;
			}

			if (!videoTrack) throw new Error('no screen track');

			const { width, height } = videoTrack.getSettings();

			if (mediaService.producers['screen'] && replace) {
				await mediaService.producers['screen'].replaceTrack({ track: videoTrack });
			} else if (!mediaService.producers['screen']) {
				if (config.simulcastSharing) {
					const encodings = getEncodings(width, height, false, true);

					await mediaService.produce('screen', {
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
					await mediaService.produce('screen', {
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

			if (replace) {
				for (const screenPeerProducer of mediaService.peerProducers['screen'].values()) {
					await screenPeerProducer.replaceTrack({ track: videoTrack });
				}
			}

			if (!p2pModeSelector(getState())) {
				mediaService.producers['screen']?.resume();

				for (const peerProducer of mediaService.peerProducers['screen'].values()) {
					peerProducer.close();
				}
			} else {
				for (const peer of peersArraySelector(getState())) {
					if (!mediaService.peerProducers['screen'].has(peer.id)) {
						await mediaService.peerProduce(peer.id, 'screen', {
							track: videoTrack,
							stopTracks: false,
							disableTrackOnPause: false,
							zeroRtpOnPause: true,
							appData: { source: 'screen' }
						});
					}
				}

				mediaService.producers['screen']?.pause();
			}

			if (replace) {
				mediaService.tracks['screen']?.stop();
				mediaService.tracks['screen'] = videoTrack;
			}

			if (enable) dispatch(meActions.setScreenEnabled(true));

			if (!replace) audioTrack = mediaService.tracks['screenaudio'];

			if (!audioTrack && stream) {
				([ audioTrack ] = stream.getAudioTracks());

				replace = true;
			}

			if (audioTrack) {
				if (mediaService.producers['screenaudio'] && replace) {
					await mediaService.producers['screenaudio'].replaceTrack({ track: audioTrack });
				} else if (!mediaService.producers['screenaudio']) {
					await mediaService.produce('screenaudio', {
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

				if (replace) {
					for (const screenAudioPeerProducer of mediaService.peerProducers['screenaudio'].values()) {
						await screenAudioPeerProducer.replaceTrack({ track: audioTrack });
					}
				}

				if (!p2pModeSelector(getState())) {
					mediaService.producers['screenaudio']?.resume();

					for (const peerProducer of mediaService.peerProducers['screenaudio'].values()) {
						peerProducer.close();
					}
				} else {
					for (const peer of peersArraySelector(getState())) {
						if (!mediaService.peerProducers['screenaudio'].has(peer.id)) {
							await mediaService.peerProduce(peer.id, 'screenaudio', {
								track: audioTrack,
								stopTracks: false,
								disableTrackOnPause: false,
								zeroRtpOnPause: true,
								appData: { source: 'screenaudio' }
							});
						}
					}

					mediaService.producers['screenaudio']?.pause();
				}

				if (replace) {
					mediaService.tracks['screenaudio']?.stop();
					mediaService.tracks['screenaudio'] = audioTrack;
				}

				if (enable) dispatch(meActions.setScreenAudioEnabled(true));
			}
		} else {
			await mediaService.tracks['screen']?.applyConstraints({
				...getVideoConstrains(screenSharingResolution, aspectRatio),
				frameRate: screenSharingFrameRate
			});

			await mediaService.tracks['screenaudio']?.applyConstraints({
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

	mediaService.closeProducer('screen', true);

	for (const peerProducer of mediaService.peerProducers['screen'].values()) {
		peerProducer.close();
	}

	mediaService.closeProducer('screenaudio', true);

	for (const peerProducer of mediaService.peerProducers['screenaudio'].values()) {
		peerProducer.close();
	}

	dispatch(meActions.setScreenEnabled(false));

	mediaService.tracks['screen']?.stop();
	mediaService.tracks['screen'] = undefined;
	mediaService.tracks['screenaudio']?.stop();
	mediaService.tracks['screenaudio'] = undefined;
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

	let track: MediaStreamTrack | undefined;

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
			if (!replace) track = mediaService.tracks['extravideo'];

			if (!track) {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						deviceId: { ideal: deviceId },
						...getVideoConstrains(resolution, aspectRatio),
						frameRate,
					}
				});

				([ track ] = stream.getVideoTracks());

				replace = true;
			}

			if (!track) throw new Error('no webcam track');

			const { width, height } = track.getSettings();

			if (blurEnabled && replace) track = await effectsService.applyEffect(track);

			if (mediaService.producers['extravideo'] && replace) {
				await mediaService.producers['extravideo'].replaceTrack({ track });
			} else if (!mediaService.producers['extravideo']) {
				if (config.simulcast) {
					const encodings = getEncodings(width, height);

					await mediaService.produce('extravideo', {
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
					await mediaService.produce('extravideo', {
						track,
						stopTracks: false,
						disableTrackOnPause: false,
						zeroRtpOnPause: true,
						appData: { source: 'extravideo' }
					}, 'video/h264');
				}
			}

			if (replace) {
				for (const extraVideoPeerProducer of mediaService.peerProducers['extravideo'].values()) {
					await extraVideoPeerProducer.replaceTrack({ track });
				}
			}
		
			if (!p2pModeSelector(getState())) {
				mediaService.producers['extravideo']?.resume();

				for (const peerProducer of mediaService.peerProducers['extravideo'].values()) {
					peerProducer.close();
				}
			} else {
				for (const peer of peersArraySelector(getState())) {
					if (!mediaService.peerProducers['extravideo'].has(peer.id)) {
						await mediaService.peerProduce(peer.id, 'extravideo', {
							track,
							stopTracks: false,
							disableTrackOnPause: false,
							zeroRtpOnPause: true,
							appData: { source: 'extravideo' }
						});
					}
				}

				mediaService.producers['extravideo']?.pause();
			}

			if (replace && mediaService.tracks['extravideo']) {
				effectsService.stop(mediaService.tracks['extravideo']?.id);
				mediaService.tracks['extravideo']?.stop();
			}

			mediaService.tracks['extravideo'] = track;
		} else {
			await mediaService.tracks['extravideo']?.applyConstraints({
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

	mediaService.closeProducer('extravideo', true);

	for (const peerProducer of mediaService.peerProducers['extravideo'].values()) {
		peerProducer.close();
	}

	dispatch(meActions.setExtraVideoEnabled(false));

	mediaService.tracks['extravideo']?.stop();
	mediaService.tracks['extravideo'] = undefined;
};
