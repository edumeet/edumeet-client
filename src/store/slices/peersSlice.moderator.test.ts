import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {} } }));

import peersSlice, { peersActions } from './peersSlice';

const reducer = peersSlice.reducer;

describe('the moderator flag of a peer', () => {
	const joined = reducer(undefined, peersActions.addPeer({ id: 'p', sessionId: 's', displayName: 'Ola', moderator: false }));

	it('is set and cleared by an update, false included', () => {
		const promoted = reducer(joined, peersActions.updatePeer({ id: 'p', moderator: true }));

		expect(promoted.p.moderator).toBe(true);
		expect(reducer(promoted, peersActions.updatePeer({ id: 'p', moderator: false })).p.moderator).toBe(false);
	});

	it('is kept by an update about something else', () => {
		const promoted = reducer(joined, peersActions.updatePeer({ id: 'p', moderator: true }));

		expect(reducer(promoted, peersActions.updatePeer({ id: 'p', raisedHand: true })).p.moderator).toBe(true);
	});
});
