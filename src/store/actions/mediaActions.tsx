import { AppDispatch, RootState } from '../store';
import { Logger } from '../../utils/logger';
import { meActions } from '../slices/meSlice';
import { settingsActions } from '../slices/settingsSlice';
import { webcamProducerSelector } from '../selectors';
import { producersActions } from '../slices/producersSlice';
import { Resolution } from '../../utils/types';

const logger = new Logger('MediaService');

const VIDEO_CONSTRAINS: Record<Resolution, Record<string, number>> = {
	'low': {
		width: 320
	},
	'medium': {
		width: 640
	},
	'high': {
		width: 1280
	},
	'veryhigh': {
		width: 1920
	},
	'ultra': {
		width: 3840
	}
};

const getVideoConstrains = (resolution: Resolution, aspectRatio: number) => ({
	width: { ideal: VIDEO_CONSTRAINS[resolution].width },
	height: { ideal: VIDEO_CONSTRAINS[resolution].width / aspectRatio }
});

export interface UpdateWebcamOptions {
	init?: boolean;
	start?: boolean;
	restart?: boolean;
	newDeviceId?: string;
	newResolution?: string;
	newFrameRate?: number;
}

export const updateWebcam = ({
	init = false,
	start = false,
	restart = false,
	newDeviceId,
	newResolution,
	newFrameRate
}: UpdateWebcamOptions) =>
	async (dispatch: AppDispatch, getState: RootState /* , { signalingService } */) => {
		logger.debug(
			'updateWebcam() [init:%s, start:%s, restart:%s, newDeviceId:%s, newResolution:%s, newFrameRate:%s]',
			init,
			start,
			restart,
			newDeviceId,
			newResolution,
			newFrameRate
		);

		if (newDeviceId && !restart) {
			logger.warn('updateWebcam() changing device requires restart');

			return;
		}

		dispatch(meActions.setWebcamInProgress({ webcamInProgress: true }));

		let track;

		if (newDeviceId) {
			dispatch(
				settingsActions.setSelectedVideoDevice({
					deviceId: newDeviceId
				})
			);
		}

		if (newResolution) {
			dispatch(
				settingsActions.setResolution({ resolution: newResolution }));
		}

		if (newFrameRate) {
			dispatch(
				settingsActions.setFrameRate({ frameRate: newFrameRate }));
		}

		const { aspectRatio, resolution, frameRate } = getState().settings;
		const webcamProducer = webcamProducerSelector(getState());

		if ((restart && webcamProducer) || start) {
			if (webcamProducer) {
				dispatch(producersActions.closeProducer({
					producerId: webcamProducer.id,
					local: true
				}));
			}

			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					// deviceId: { ideal: deviceId },
					...getVideoConstrains(resolution, aspectRatio),
					frameRate
				}
			});

			([ track ] = stream.getVideoTracks());
		}

		dispatch(meActions.setWebcamInProgress({ webcamInProgress: false }));
	};

export interface UpdateMicOptions {
	start?: boolean;
	restart?: boolean;
	newDeviceId?: string;
}

export const updateMic = ({
	start = false,
	restart = true,
	newDeviceId
}: UpdateMicOptions) =>
	async (dispatch: AppDispatch, getState: RootState /* , { signalingService } */) => {
		logger.debug(
			'updateMic() [start:%s, restart:%s, newDeviceId:%s]',
			start,
			restart,
			newDeviceId
		);

		dispatch(meActions.setAudioInProgress({ audioInProgress: true }));

		// Get the track and propagate it to the store

		dispatch(meActions.setAudioInProgress({ audioInProgress: false }));
	};

export interface UpdateScreenOptions {
	start?: boolean;
	newResolution?: string;
	newFrameRate?: string;
}

export const updateScreen = ({
	start = false,
	newResolution,
	newFrameRate
}: UpdateScreenOptions) =>
	async (dispatch: AppDispatch, getState: RootState /* , { signalingService } */) => {
		logger.debug(
			'updateScreen() [start:%s, newResolution:%s, newFrameRate:%s]',
			start,
			newResolution,
			newFrameRate
		);

		dispatch(meActions.setScreenShareInProgress({ screenShareInProgress: true }));

		// Get the track and propagate it to the store

		dispatch(meActions.setScreenShareInProgress({ screenShareInProgress: false }));
	};