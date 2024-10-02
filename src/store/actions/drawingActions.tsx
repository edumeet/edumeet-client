import { Logger } from '../../utils/Logger';
import { drawingActions, DrawingState } from '../slices/drawingSlice';
import { AppThunk } from '../store';

const logger = new Logger('DrawingActions');

/**
 * This thunk action enables the drawing.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const enableDrawing = (): AppThunk<Promise<void>> => async (dispatch, getState, { signalingService }): Promise<void> => {
	logger.debug('moderator:enableDrawing()');

	try {
		await signalingService.sendRequest('moderator:enableDrawing');

		dispatch(drawingActions.enableDrawing(true));
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

		dispatch(drawingActions.disableDrawing(false));
	} catch (error) {
		logger.error('moderator:disableDrawing() [error:"%o"]', error);
	}
};

/**
 * This thunk action set background color of drawing.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const setDrawingBgColor = (bgColor: DrawingState['bgColor']): 
AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('setDrawingBgColor()');

	try {
		await signalingService.sendRequest('setDrawingBgColor', bgColor);

		dispatch(drawingActions.setDrawingBgColor(bgColor));
	} catch (error) {
		logger.error('setDrawingBgColor() [error:"%o"]', error);
	}
};