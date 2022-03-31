import { AppDispatch, RootState } from '../store';
import { Logger } from '../../utils/logger';
import { meActions } from '../slices/meSlice';

const logger = new Logger('MediaService');

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