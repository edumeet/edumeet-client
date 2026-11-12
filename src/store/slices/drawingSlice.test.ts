import { describe, expect, it } from 'vitest';
import drawingSlice, { drawingActions } from './drawingSlice';

describe('the whiteboard', () => {
	it('opens with the pencil', () => {
		expect(drawingSlice.reducer(undefined, { type: 'init' }).tool).toBe('pencilBrush');
	});

	it('keeps the tool chosen last', () => {
		const state = drawingSlice.reducer(undefined, drawingActions.setDrawingTool('eraser'));

		expect(drawingSlice.reducer(state, drawingActions.clear()).tool).toBe('eraser');
	});
});
