import { Producer } from 'mediasoup-client/lib/Producer';
import { getEncodings, getVideoConstrains } from '../../utils/encodingsHandler';
import { Logger } from '../../utils/logger';
import { meActions } from '../slices/meSlice';
import { producersActions } from '../slices/producersSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';

const logger = new Logger('MediaActions');

interface UpdateDeviceOptions {
	init?: boolean;
	start?: boolean;
	restart?: boolean;
	updateMute?: boolean;
	newDeviceId?: string;
	newResolution?: string;
	newFrameRate?: number;
}

export const updatePreviewMic = ({
	restart = false,
	updateMute = true,
	newDeviceId
}: UpdateDeviceOptions = {}) => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ mediaService, deviceService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('updatePreviewMic()');

	dispatch(meActions.setAudioInProgress(true));

	let track: MediaStreamTrack | undefined | null;

	try {
		await deviceService.updateMediaDevices();

		if (newDeviceId)
			dispatch(settingsActions.setSelectedAudioDevice(newDeviceId));

		const {
			autoGainControl,
			echoCancellation,
			noiseSuppression,
			sampleRate,
			channelCount,
			sampleSize,
			selectedAudioDevice
		} = getState().settings;
		const deviceId = deviceService.getDeviceId(selectedAudioDevice, 'audioinput');

		if (!deviceId)
			logger.warn('updatePreviewMic() no audio devices');

		if (restart) {
			const { previewMicTrackId } = getState().me;

			track = mediaService.getTrack(previewMicTrackId);

			track?.stop();

			dispatch(meActions.setPreviewMicTrackId());
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

		const { deviceId: trackDeviceId } = track.getSettings();

		dispatch(settingsActions.setSelectedAudioDevice(trackDeviceId));

		mediaService.addTrack(track);
		dispatch(meActions.setPreviewMicTrackId(track.id));
		if (updateMute)
			dispatch(settingsActions.setAudioMuted(false));

		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('updatePreviewMic() [error:%o]', error);
	} finally {
		dispatch(meActions.setAudioInProgress(false));
	}
};

export const stopPreviewMic = ({
	updateMute = true,
}: UpdateDeviceOptions = {}) => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ mediaService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('stopPreviewMic()');

	dispatch(meActions.setAudioInProgress(true));

	const { previewMicTrackId } = getState().me;
	const track = mediaService.getTrack(previewMicTrackId);
	
	dispatch(meActions.setPreviewMicTrackId());
	if (updateMute)
		dispatch(settingsActions.setAudioMuted(true));

	mediaService.removeTrack(track?.id);
	track?.stop();

	dispatch(meActions.setAudioInProgress(false));
};

export const updatePreviewWebcam = ({
	restart = false,
	updateMute = true,
	newDeviceId
}: UpdateDeviceOptions = {}) => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ mediaService, deviceService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('updatePreviewWebcam()');

	dispatch(meActions.setVideoInProgress(true));

	let track: MediaStreamTrack | undefined | null;

	try {
		await deviceService.updateMediaDevices();

		if (newDeviceId)
			dispatch(settingsActions.setSelectedVideoDevice(newDeviceId));

		const {
			aspectRatio,
			resolution,
			frameRate,
			selectedVideoDevice
		} = getState().settings;

		const deviceId = deviceService.getDeviceId(selectedVideoDevice, 'videoinput');

		if (!deviceId)
			logger.warn('updatePreviewWebcam() no webcam devices');

		if (restart) {
			const { previewWebcamTrackId } = getState().me;

			track = mediaService.getTrack(previewWebcamTrackId);

			track?.stop();

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

		const { deviceId: trackDeviceId } = track.getSettings();

		// User may have chosen a different device than the one initially selected
		// so we need to update the selected device in the settings just in case
		dispatch(settingsActions.setSelectedVideoDevice(trackDeviceId));

		mediaService.addTrack(track);
		dispatch(meActions.setPreviewWebcamTrackId(track.id));
		if (updateMute)
			dispatch(settingsActions.setVideoMuted(false));

		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('updatePreviewWebcam() [error:%o]', error);
	} finally {
		dispatch(meActions.setVideoInProgress(false));
	}
};

export const stopPreviewWebcam = ({
	updateMute = true,
}: UpdateDeviceOptions = {}) => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ mediaService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('stopPreviewWebcam()');

	dispatch(meActions.setVideoInProgress(true));

	const { previewWebcamTrackId } = getState().me;
	const track = mediaService.getTrack(previewWebcamTrackId);

	dispatch(meActions.setPreviewWebcamTrackId());
	if (updateMute)
		dispatch(settingsActions.setVideoMuted(true));

	mediaService.removeTrack(track?.id);
	track?.stop();

	dispatch(meActions.setVideoInProgress(false));
};

export const updateMic = ({
	start = false,
	restart = false,
	newDeviceId
}: UpdateDeviceOptions = {}) => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ mediaService, deviceService }: MiddlewareOptions
): Promise<void> => {
	logger.debug(
		'updateMic() [start:%s, restart:%s, newDeviceId:"%s"]',
		start,
		restart,
		newDeviceId
	);

	dispatch(meActions.setAudioInProgress(true));

	let track: MediaStreamTrack | null | undefined;
	let micProducer: Producer | null | undefined;

	try {
		await deviceService.updateMediaDevices();

		const canSendMic = getState().me.canSendMic;

		if (!canSendMic)
			throw new Error('cannot produce audio');

		if (newDeviceId && !restart)
			throw new Error('changing device requires restart');

		if (newDeviceId)
			dispatch(settingsActions.setSelectedAudioDevice(newDeviceId));

		const previewMicTrackId = getState().me.previewMicTrackId;
		const selectedAudioDevice = getState().settings.selectedAudioDevice;
		const deviceId = deviceService.getDeviceId(selectedAudioDevice, 'audioinput');

		if (!deviceId)
			logger.warn('no audio devices');

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

		micProducer =
			mediaService.getProducers()
				.find((producer) => producer.appData.source === 'mic');

		if ((restart && micProducer) || start) {
			let muted = false;

			if (micProducer) {
				muted = micProducer.paused;

				dispatch(producersActions.closeProducer({
					producerId: micProducer.id,
					local: true
				}));
			}

			if (previewMicTrackId)
				track = mediaService.getTrack(previewMicTrackId);

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

			if (!track)
				throw new Error('no mic track');

			dispatch(meActions.setPreviewMicTrackId());
			mediaService.removeTrack(previewMicTrackId);

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
				source: micProducer.appData.source,
				paused: micProducer.paused
			}));

			dispatch(settingsActions.setAudioMuted(false));

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

		await deviceService.updateMediaDevices();
	} catch (error) {
		logger.error('updateMic() [error:%o]', error);
	} finally {
		dispatch(meActions.setAudioInProgress(false));
	}
};

export const updateWebcam = ({
	init = false,
	start = false,
	restart = false,
	newDeviceId,
	newResolution,
	newFrameRate
}: UpdateDeviceOptions = {}) => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ mediaService, deviceService, config }: MiddlewareOptions
): Promise<void> => {
	logger.debug(
		'updateWebcam [init:%s, start:%s, restart:%s, newDeviceId:%s, newResolution:%s, newFrameRate:%s]',
		init,
		start,
		restart,
		newDeviceId,
		newResolution,
		newFrameRate
	);

	dispatch(meActions.setVideoInProgress(true));

	let track: MediaStreamTrack | null | undefined;
	let webcamProducer: Producer | null | undefined;

	try {
		await deviceService.updateMediaDevices();

		const canSendWebcam = getState().me.canSendWebcam;

		if (!canSendWebcam)
			throw new Error('cannot produce video');

		if (newDeviceId && !restart)
			throw new Error('changing device requires restart');

		if (newDeviceId)
			dispatch(settingsActions.setSelectedVideoDevice(newDeviceId));

		if (newResolution)
			dispatch(settingsActions.setResolution(newResolution));

		if (newFrameRate)
			dispatch(settingsActions.setFrameRate(newFrameRate));

		/*
			const { videoMuted } = store.getState().settings;

			if (init && videoMuted)
				return;
			else
				store.dispatch(settingsActions.setVideoMuted(false));
		*/

		const {
			aspectRatio,
			resolution,
			frameRate,
			selectedVideoDevice
		} = getState().settings;
		
		const deviceId = deviceService.getDeviceId(selectedVideoDevice, 'videoinput');
		const previewWebcamTrackId = getState().me.previewWebcamTrackId;

		if (!deviceId)
			logger.warn('no webcam devices');

		webcamProducer =
			mediaService.getProducers()
				.find((producer) => producer.appData.source === 'webcam');

		if ((restart && webcamProducer) || start) {
			if (webcamProducer) {
				dispatch(producersActions.closeProducer({
					producerId: webcamProducer.id,
					local: true
				}));
			}

			if (previewWebcamTrackId)
				track = mediaService.getTrack(previewWebcamTrackId);

			if (!track) {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						deviceId: { ideal: deviceId },
						...getVideoConstrains(resolution, aspectRatio),
						frameRate
					}
				});
	
				([ track ] = stream.getVideoTracks());
			}

			if (!track)
				throw new Error('no webcam track');

			dispatch(meActions.setPreviewWebcamTrackId());
			mediaService.removeTrack(previewWebcamTrackId);

			const { deviceId: trackDeviceId, width, height } = track.getSettings();

			// User may have chosen a different device than the one initially selected
			// so we need to update the selected device in the settings just in case
			dispatch(settingsActions.setSelectedVideoDevice(trackDeviceId));

			if (config.simulcast) {
				const encodings = getEncodings(
					mediaService.rtpCapabilities,
					width,
					height
				);

				const resolutionScalings =
					encodings.map((encoding) => encoding.scaleResolutionDownBy);

				webcamProducer = await mediaService.produce({
					track,
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
					track,
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
				source: webcamProducer.appData.source,
				paused: webcamProducer.paused,
			}));

			dispatch(settingsActions.setVideoMuted(false));
		} else if (webcamProducer) {
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
		dispatch(meActions.setVideoInProgress(false));
	}
};

export const updateScreenSharing = ({
	start = false,
	newResolution,
	newFrameRate
}: UpdateDeviceOptions = {}) => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ mediaService, config }: MiddlewareOptions
): Promise<void> => {
	logger.debug(
		'updateScreenSharing() [start:%s, newResolution:%s, newFrameRate:%s]',
		start,
		newResolution,
		newFrameRate
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

		if (newResolution)
			dispatch(settingsActions.setScreenSharingResolution(newResolution));

		if (newFrameRate)
			dispatch(settingsActions.setScreenSharingFrameRate(newFrameRate));

		const {
			screenSharingResolution,
			autoGainControl,
			echoCancellation,
			noiseSuppression,
			aspectRatio,
			screenSharingFrameRate,
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

		if (start) {
			const stream = await navigator.mediaDevices.getDisplayMedia({
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
				}
			});

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
				source: screenVideoProducer.appData.source,
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
					source: screenAudioProducer.appData.source,
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