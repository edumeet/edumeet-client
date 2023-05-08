import { Logger } from 'edumeet-common';
import { filesharingActions } from '../slices/filesharingSlice';
import { roomActions } from '../slices/roomSlice';
import { AppThunk } from '../store';

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
	{ fileService }
): Promise<void> => {
	logger.debug('sendFiles() [files:"%s"]', files);

	dispatch(roomActions.updateRoom({ startFileSharingInProgress: true }));

	try {
		const magnetURI = await fileService.sendFiles(files);

		const peerId = getState().me.id;
		const sessionId = getState().me.sessionId;
		const displayName = getState().settings.displayName;
		const timestamp = Date.now();

		dispatch(filesharingActions.addFile({
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

		dispatch(filesharingActions.clearFiles());
	} catch (error) {
		logger.error('clearFiles() [error:%o]', error);
	}
};