import { describe, expect, it } from 'vitest';
import drawingSlice, { drawingActions } from './drawingSlice';

describe('the whiteboard', () => {
	it('opens with the pencil', () => {
		expect(drawingSlice.reducer(undefined, { type: 'init' }).tool).toBe('pencilBrush');
	});

	it('keeps the board of a closing view and does not apply the last change to it again', () => {
		const board = [ { object: { id: 1 }, status: 'added' } as never ];
		const updated = drawingSlice.reducer(undefined, drawingActions.updateCanvas(board[0]));
		const kept = drawingSlice.reducer(updated, drawingActions.keepCanvas(board));

		expect(kept.initiateAction).toEqual(board);
		expect(kept.updateAction).toBeUndefined();
	});

	it('keeps the tool chosen last', () => {
		const state = drawingSlice.reducer(undefined, drawingActions.setDrawingTool('eraser'));

		expect(drawingSlice.reducer(state, drawingActions.clear()).tool).toBe('eraser');
	});
});
