import { Logger } from '../../utils/Logger';
import { drawingActions, DrawingState, FabricAction, } from '../slices/drawingSlice';
import { AppThunk } from '../store';

const logger = new Logger('DrawingActions');

/**
 * This thunk action enables the drawing.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const enableDrawing = (): AppThunk<Promise<void>> => async (
	dispatch, 
	_getState, 
	{ signalingService }
): Promise<void> => {
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
	_getState,
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
	_getState,
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

/**
 * This thunk action updates the canvas .
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const updateCanvasState = (action: FabricAction): 
AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('updateCanvasState()');

	try {
		await signalingService.sendRequest('updateCanvasState', action);

		// dispatch(drawingActions.recordAction(action));

	} catch (error) {
		logger.error('updateCanvasState() [error:"%o"]', error);
	}
};

/**
 * This thunk action clears the canvas .
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const clearCanvas = (): 
AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('clearCanvas()');

	try {
		await signalingService.sendRequest('clearCanvas');

		dispatch(drawingActions.clear);

	} catch (error) {
		logger.error('clearCanvas() [error:"%o"]', error);
	}
};