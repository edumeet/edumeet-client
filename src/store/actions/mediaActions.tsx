import { RootDispatch, RootState } from '../store';
import { Logger } from '../../utils/logger';

const logger = new Logger('MediaService');

export interface UpdateWebcamOptions {
	init?: boolean;
	start?: boolean;
	restart?: boolean;
	newDeviceId?: string;
	newResolution?: string;
	newFrameRate?: string;
}

export const updateWebcam = (options: UpdateWebcamOptions) =>
	async (dispatch: RootDispatch, getState: RootState /* , { signalingService } */) => {
		logger.debug('updateWebcam() [options:%o]', options);
	};