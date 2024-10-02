import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DrawingState {
	drawingEnabled?: boolean;
	zoom: number,
	tools: [ 'pencilBrush', 'text', 'eraser' ],
	tool: DrawingState['tools'][number],
	pencilBrushSize: number,
	pencilBrushSizeRange: { min: number, max: number },
	textSize: number,
	textSizeRange: { min: number, max: number },
	eraserSize: number,
	eraserSizeRange: { min: number, max: number },
	colorsPickers: [ 'Row', 'Popover' ],
	colorsPicker: DrawingState['colorsPickers'][number],
	colors: [ 'black', 'white', 'gray', 'green', 'yellow', 'orange', 'red', 'blue', 'purple' ],
	color: DrawingState['colors'][number],
	bgColors: ['gray', 'white', 'black'],
	bgColor: DrawingState['bgColors'][number]
	history: string
	historyUndo: fabric.Object[]
	historyRedo: fabric.Object[]
}

const initialState: DrawingState = {
	drawingEnabled: false,
	tools: [ 'pencilBrush', 'text', 'eraser' ],
	tool: 'pencilBrush',
	pencilBrushSize: 20,
	pencilBrushSizeRange: { min: 1, max: 100 },
	textSize: 30,
	textSizeRange: { min: 1, max: 100 },
	eraserSize: 60,
	eraserSizeRange: { min: 1, max: 100 },
	zoom: 10,
	colorsPickers: [ 'Row', 'Popover' ],
	colorsPicker: 'Popover',
	colors: [ 'black', 'white', 'gray', 'green', 'yellow', 'orange', 'red', 'blue', 'purple' ],
	color: 'black',
	bgColors: [ 'gray', 'white', 'black' ],
	bgColor: 'gray',
	history: '',
	historyUndo: [],
	historyRedo: [],
};

const drawingSlice = createSlice({
	name: 'drawing',
	initialState,
	reducers: {
		enableDrawing: ((state, action: PayloadAction<boolean>) => {
			state.drawingEnabled = action.payload;
		}),
		disableDrawing: ((state, action: PayloadAction<boolean>) => {
			state.drawingEnabled = action.payload;
		}),
		setDrawingTool: ((state, action: PayloadAction<DrawingState['tool']>) => {
			state.tool = action.payload;
		}),
		setDrawingColorsPicker: ((state, action: PayloadAction<DrawingState['colorsPicker']>) => {
			state.colorsPicker = action.payload;
		}),
		setDrawingColor: ((state, action: PayloadAction<DrawingState['color']>) => {
			state.color = action.payload;
		}),
		setDrawingBgColor: ((state, action: PayloadAction<DrawingState['bgColor']>) => {
			state.bgColor = action.payload;
		}),
		setDrawingHistory: ((state, action: PayloadAction<string>) => {
			state.history = action.payload;
		}),
		setDrawingZoom: ((state, action: PayloadAction<number>) => {
			state.zoom = action.payload;
		}),
		setDrawingPencilBrushSize: ((state, action: PayloadAction<{ operation: 'inc' | 'dec'}>) => {
			
			const operation = action.payload.operation;
			const { min, max } = state.pencilBrushSizeRange;
			const curr = state.pencilBrushSize;

			(operation === 'inc' && curr < max) && state.pencilBrushSize++;
			(operation === 'dec' && curr > min) && state.pencilBrushSize--;
		}),
	
		setDrawingTextSize: ((state, action: PayloadAction<{ operation: 'inc' | 'dec'}>) => {
			
			const operation = action.payload.operation;
			const { min, max } = state.textSizeRange;
			const curr = state.textSize;

			(operation === 'inc' && curr < max) && state.textSize++;
			(operation === 'dec' && curr > min) && state.textSize--;
		}),
	
		setDrawingEraserSize: ((state, action: PayloadAction<{ operation: 'inc' | 'dec'}>) => {
			
			const operation = action.payload.operation;
			const { min, max } = state.eraserSizeRange;
			const curr = state.eraserSize;

			(operation === 'inc' && curr < max) && state.eraserSize++;
			(operation === 'dec' && curr > min) && state.eraserSize--;
		}),
	}
});

export const drawingActions = drawingSlice.actions;
export default drawingSlice;
