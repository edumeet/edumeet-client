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
	logger.debug('enableDrawing()');

	try {
		await signalingService.sendRequest('enableDrawing');

		dispatch(drawingActions.enableDrawing());
	} catch (error) {
		logger.error('enableDrawing() [error:"%o"]', error);
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
	logger.debug('disableDrawing()');

	try {
		await signalingService.sendRequest('disableDrawing');

		dispatch(drawingActions.disableDrawing());
	} catch (error) {
		logger.error('disableDrawing() [error:"%o"]', error);
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