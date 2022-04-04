import { Logger } from '../../utils/logger';
import { meActions } from '../slices/meSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';

const logger = new Logger('MediaActions');

interface UpdateDeviceOptions {
	restart?: boolean;
	newDeviceId?: string;
}

export const updatePreviewMic = ({
	restart = false,
	newDeviceId
}: UpdateDeviceOptions = {}) => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ mediaService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('updatePreviewMic()');

	dispatch(meActions.setAudioInProgress(true));

	let track: MediaStreamTrack | undefined | null;

	try {
		await mediaService.updateMediaDevices();

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
		const deviceId = mediaService.getDeviceId(selectedAudioDevice, 'audioinput');

		if (!deviceId)
			throw new Error('no audio devices');

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
		dispatch(settingsActions.setAudioMuted(false));

		await mediaService.updateMediaDevices();
	} catch (error) {
		logger.error('updatePreviewMic() [error:%o]', error);
	} finally {
		dispatch(meActions.setAudioInProgress(false));
	}
};

export const stopPreviewMic = () => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ mediaService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('stopPreviewMic()');

	dispatch(meActions.setAudioInProgress(true));

	const { previewMicTrackId } = getState().me;
	const track = mediaService.getTrack(previewMicTrackId);

	track?.stop();

	dispatch(meActions.setPreviewMicTrackId());
	dispatch(settingsActions.setAudioMuted(true));

	dispatch(meActions.setAudioInProgress(false));
};

export const updatePreviewWebcam = ({
	restart = false,
	newDeviceId
}: UpdateDeviceOptions = {}) => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ mediaService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('updatePreviewWebcam()');

	dispatch(meActions.setVideoInProgress(true));

	let track: MediaStreamTrack | undefined | null;

	try {
		await mediaService.updateMediaDevices();

		if (newDeviceId)
			dispatch(settingsActions.setSelectedVideoDevice(newDeviceId));

		const {
			aspectRatio,
			resolution,
			frameRate,
			selectedVideoDevice
		} = getState().settings;

		const deviceId = mediaService.getDeviceId(selectedVideoDevice, 'videoinput');

		if (!deviceId)
			throw new Error('no webcam devices');

		if (restart) {
			const { previewWebcamTrackId } = getState().me;

			track = mediaService.getTrack(previewWebcamTrackId);

			track?.stop();

			dispatch(meActions.setPreviewWebcamTrackId());
		}

		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				deviceId: { ideal: deviceId },
				...mediaService.getVideoConstrains(resolution, aspectRatio),
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
		dispatch(settingsActions.setVideoMuted(false));

		await mediaService.updateMediaDevices();
	} catch (error) {
		logger.error('updatePreviewWebcam() [error:%o]', error);
	} finally {
		dispatch(meActions.setVideoInProgress(false));
	}
};

export const stopPreviewWebcam = () => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ mediaService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('stopPreviewWebcam()');

	dispatch(meActions.setVideoInProgress(true));

	const { previewWebcamTrackId } = getState().me;
	const track = mediaService.getTrack(previewWebcamTrackId);

	track?.stop();

	dispatch(meActions.setPreviewWebcamTrackId());
	dispatch(settingsActions.setVideoMuted(true));

	dispatch(meActions.setVideoInProgress(false));
};