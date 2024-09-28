import { Logger } from '../../utils/Logger';
import { drawingActions } from '../slices/drawingSlice';
import { AppThunk } from '../store';

const logger = new Logger('DrawingActions');

/**
 * This thunk action enables the drawing.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const enableDrawing = (): 
AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('moderator:enableDrawing()');

	try {
		await signalingService.sendRequest('moderator:enableDrawing');

		dispatch(drawingActions.enableDrawing());
	} catch (error) {
		logger.error('moderator:enableDrawing() [error:"%o"]', error);
	}
};

/** 
 * This thunk action disables the drawing.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const disableDrawing = (): 
AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('moderator:disableDrawing()');

	try {
		await signalingService.sendRequest('moderator:disableDrawing');

		// const peerId = getState().me.id;

		dispatch(drawingActions.disableDrawing());
	} catch (error) {
		logger.error('moderator:disableDrawing() [error:"%o"]', error);
	}
};

/**
 * 
 * This thunk action starts the drawing.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 * 
 */
export const startDrawing = (): 
AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('startDrawing)');

	try {
		await signalingService.sendRequest('moderator:startDrawing');

	} catch (error) {
		logger.error('startDrawing() [error:"%o"]', error);
	}
};

/**
 * 
 * This thunk action stops the drawing.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 *
 */
export const stopDrawing = (): 
AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('stopDrawing()');

	try {
		await signalingService.sendRequest('moderator:stopDrawing');

	} catch (error) {
		logger.error('stopDrawing() [error:"%o"]', error);
	}
};

/**
 * 
 * This thunk action sets the drawing remaining time.
 * 
 * @param time - Time to set.
 * @returns {AppThunk<Promise<void>>} Promise.
 *
 */
export const updateDrawing = (time : string): 
AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('updateDrawing() [time:"%s"]', time);

	try {
		
		signalingService.sendRequest('moderator:updateDrawing', time);

		// dispatch(drawingActions.updateDrawingRemainingTime(time));
		
		// dispatch(drawingActions.updateDrawing(time));

	} catch (error) {
		logger.error('updateDrawing() [error:"%o"]', error);
	}
};