import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {} } }));

import roomSlice, { roomActions } from './roomSlice';

describe('roomSlice leave reason', () => {
	const reducer = roomSlice.reducer;
	const initial = reducer(undefined, { type: 'init' });

	it('starts as a normal client without a reason', () => {
		expect(initial.headless).toBe(false);
		expect(initial.leaveReason).toBeUndefined();
	});

	it('keeps the first reason, later ones are consequences', () => {
		const kicked = reducer(initial, roomActions.setLeaveReason('kicked'));
		const thenClosed = reducer(kicked, roomActions.setLeaveReason('connectionClosed'));

		expect(thenClosed.leaveReason).toBe('kicked');
	});
});
