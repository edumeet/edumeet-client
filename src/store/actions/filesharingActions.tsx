import { Logger } from '../../utils/logger';
import { filesharingActions } from '../slices/filesharingSlice';
import { roomActions } from '../slices/roomSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';

const logger = new Logger('FilesharingActions');

export const sendFiles = (files: FileList) => async (
	dispatch: AppDispatch,
	getState: RootState,
	{ fileService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('sendFiles() [files:"%s"]', files);

	dispatch(roomActions.updateRoom({ startFileSharingInProgress: true }));

	try {
		const magnetURI = await fileService.sendFiles(files);

		const peerId = getState().me.id;
		const displayName = getState().settings.displayName;
		const timestamp = Date.now();

		dispatch(filesharingActions.addFile({
			peerId,
			displayName,
			timestamp,
			magnetURI,
			started: false,
		}));
	} catch (error) {
		logger.error('sendFiles() [error:"%o"]', error);
	} finally {
		dispatch(roomActions.updateRoom({ startFileSharingInProgress: false }));
	}
};