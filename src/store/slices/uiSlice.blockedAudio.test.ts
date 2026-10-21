import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, browserWarnings: [] } }));

import uiSlice, { uiActions } from './uiSlice';

const initial = uiSlice.reducer(undefined, { type: 'init' });

describe('consumers whose audio the browser refused to play', () => {
	it('starts with none', () => {
		expect(initial.blockedAudioConsumers).toEqual([]);
	});

	it('lists each consumer once', () => {
		let state = uiSlice.reducer(initial, uiActions.addBlockedAudioConsumer('a'));

		state = uiSlice.reducer(state, uiActions.addBlockedAudioConsumer('b'));
		state = uiSlice.reducer(state, uiActions.addBlockedAudioConsumer('a'));

		expect(state.blockedAudioConsumers).toEqual([ 'a', 'b' ]);
	});

	it('removes only the consumer that plays again', () => {
		let state = uiSlice.reducer(initial, uiActions.addBlockedAudioConsumer('a'));

		state = uiSlice.reducer(state, uiActions.addBlockedAudioConsumer('b'));
		state = uiSlice.reducer(state, uiActions.removeBlockedAudioConsumer('a'));

		expect(state.blockedAudioConsumers).toEqual([ 'b' ]);
	});

	it('keeps the same state when a consumer that was never blocked goes away', () => {
		const state = uiSlice.reducer(initial, uiActions.addBlockedAudioConsumer('a'));

		expect(uiSlice.reducer(state, uiActions.removeBlockedAudioConsumer('x'))).toBe(state);
		expect(uiSlice.reducer(state, uiActions.addBlockedAudioConsumer('a'))).toBe(state);
	});
});
