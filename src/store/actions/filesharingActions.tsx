import { Logger } from 'edumeet-common';
import { roomActions } from '../slices/roomSlice';
import { AppThunk } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';

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