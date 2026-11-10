import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {} } }));
vi.mock('../store', () => ({}));
vi.mock('../../components/translated/translatedComponents', () => ({
	drawingChangeRefusedLabel: () => 'The others do not see the last change',
}));

import { updateCanvasState } from './drawingActions';
import { notificationsActions } from '../slices/notificationsSlice';
import type { FabricAction } from '../slices/drawingSlice';

const action = { object: { id: 1, type: 'path' }, status: 'added' } as unknown as FabricAction;

const send = async (sendRequest: () => Promise<unknown>) => {
	const dispatch = vi.fn();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await (updateCanvasState(action) as any)(dispatch, () => ({}), { signalingService: { sendRequest } });

	return dispatch.mock.calls
		.map(([ dispatched ]) => dispatched)
		.filter((dispatched) => dispatched.type === notificationsActions.enqueueNotification.type);
};

const refused = () => Promise.reject(new Error('Server error'));

describe('a drawing change the room server refuses', () => {
	let now = Date.parse('2030-01-01T00:00:00Z');

	beforeEach(() => {
		now += 3_600_000;
		vi.useFakeTimers();
		vi.setSystemTime(now);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('is shown once, not for every further stroke, and again after a while', async () => {
		const first = await send(refused);

		expect(first).toHaveLength(1);
		expect(first[0].payload).toEqual({ message: 'The others do not see the last change', options: { variant: 'warning' } });

		vi.advanceTimersByTime(9_000);
		expect(await send(refused)).toHaveLength(0);

		vi.advanceTimersByTime(1_000);
		expect(await send(refused)).toHaveLength(1);
	});

	it('is not shown when the change was shared', async () => {
		expect(await send(() => Promise.resolve({}))).toHaveLength(0);
	});
});
