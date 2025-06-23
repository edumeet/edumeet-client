/* eslint-disable indent */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BasicTransformEvent, FabricObject } from 'fabric';
import { castDraft } from 'immer';

// adds custom prop to fabric objects
declare module 'fabric' {
    // eslint-disable-next-line no-shadow
    interface FabricObject {
      id?: number;
    }
    interface SerializedObjectProps {
      id?: number;
    }
	interface CanvasEvents {
		'object:start:modify': Partial<BasicTransformEvent> & {
			target: FabricObject
		};
	}
  }
FabricObject.customProperties = [ 'id' ];

export interface DrawingState extends HistoryState {
    drawingEnabled?: boolean
    zoom: number
    tools: [ 'edit', 'pencilBrush', 'text', 'eraser' ]
    tool: DrawingState['tools'][number]
    pencilBrushSize: number
    pencilBrushSizeRange: { min: number, max: number }
    textSize: number
    textSizeRange: { min: number, max: number }
    eraserSize: number,
    eraserSizeRange: { min: number, max: number }
    colorsPickers: [ 'Row', 'Popover' ]
    colorsPicker: DrawingState['colorsPickers'][number]
    colors: [ 'black', 'white', 'gray', 'green', 'yellow', 'orange', 'red', 'blue', 'purple' ]
    color: DrawingState['colors'][number]
    bgColors: ['white', 'black', 'gray']
    bgColor: DrawingState['bgColors'][number]
	updateAction?: FabricAction
	initiateAction?: FabricAction[]
	clearAction: boolean
}

export interface HistoryState {
    history: {
        past: FabricAction[]
        future: FabricAction[]
    }
}

export interface FabricAction {
    object: FabricObject
	status: 'added' | 'modified' | 'removed' | 'editing' | 'lock'
}

const initialState: DrawingState = {
	drawingEnabled: false,
	tools: [ 'edit', 'pencilBrush', 'text', 'eraser' ],
	tool: 'edit',
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
	bgColors: [ 'white', 'black', 'gray' ],
	bgColor: 'white',
	history: {	
		past: [],
		future: [],
	},
	clearAction: false,
};

const drawingSlice = createSlice({
	name: 'drawing',
	initialState,
	reducers: {
		enableDrawing: ((state) => {
			state.drawingEnabled = true;
		}),
		disableDrawing: ((state) => {
			state.updateAction = undefined;
			state.drawingEnabled = false;
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

		recordAction: ((state, action: PayloadAction<FabricAction>) => {
			state.history.past.push(castDraft(action.payload));
			state.history.future = [];
		}),

		updateCanvas: ((state, action: PayloadAction<FabricAction>) => {
			state.updateAction = castDraft(action.payload);
		}),

		InitiateCanvas: ((state, action: PayloadAction<FabricAction[]>) => {
			state.initiateAction = castDraft(action.payload);
		}),

		clearCanvas: (state) => {
			state.clearAction = !state.clearAction;
		},

		undo: (state) => {
			const previousAction = state.history.past.pop();

			if (previousAction) {
				state.history.future.push(previousAction);
			}
		},

		redo: (state) => {
			const nextAction = state.history.future.pop();

			if (nextAction) {
				state.history.past.push(nextAction);
			}
		},

		clear: (state) => {
			state.history.past = [];
			state.history.future = [];
		},

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
