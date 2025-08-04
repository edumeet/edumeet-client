import { roomActions } from '../slices/roomSlice';
import { AppThunk } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { Logger } from '../../utils/Logger';
import { notificationsActions } from '../slices/notificationsSlice';
import { filesharingTooBigLabel, filesharingUnsupportedLabel } from '../../components/translated/translatedComponents';

const logger = new Logger('FilesharingActions');

/**
 * This thunk action sends a list of files.
 * 
 * @param files - List of files to send.
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const sendFiles = (files: FileList): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService, fileService }
): Promise<void> => {
	logger.debug('sendFiles() [files:"%s"]', files);
	dispatch(roomActions.updateRoom({ startFileSharingInProgress: true }));

	try {
		if (!fileService.tracker) {
			dispatch(notificationsActions.enqueueNotification({
				message: filesharingUnsupportedLabel(),
				options: { variant: 'error' }
			}));
			throw Error('No tracker configured');
		}

		for (let index = 0; index < files.length; index++) {
			const element = files[index];

			if (element.size > fileService.maxFileSize) {
				dispatch(notificationsActions.enqueueNotification({
					message: filesharingTooBigLabel(),
					options: { variant: 'error' }
				}));
				throw Error('file too big');
			}
		}
		const sessionId = getState().me.sessionId;
		const magnetURI = await fileService.sendFiles(files);

		await signalingService.sendRequest('sendFile', { magnetURI, sessionId });

		const peerId = getState().me.id;
		const displayName = getState().settings.displayName;
		const timestamp = Date.now();

		dispatch(roomSessionsActions.addFile({
			peerId,
			displayName,
			timestamp,
			magnetURI,
			started: false,
			sessionId,
		}));
	} catch (error) {
		logger.error('sendFiles() [error:"%o"]', error);
	} finally {
		dispatch(roomActions.updateRoom({ startFileSharingInProgress: false }));
	}
};

/**
 * This thunk action clears the file list for everyone.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const clearFiles = (): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('clearFiles()');

	try {
		await signalingService.sendRequest('moderator:clearFiles');

		dispatch(roomSessionsActions.clearFiles());
	} catch (error) {
		logger.error('clearFiles() [error:%o]', error);
	}
};

/**
 * This thunk action clears the file for everyone.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const clearFile = (magnetURI: string): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('clearFile()');

	try {
		await signalingService.sendRequest('clearFile', { magnetURI });
		
		dispatch(roomSessionsActions.clearFile({ magnetURI }));
	} catch (error) {
		logger.error('clearFile() [error:%o]', error);
	}
};
