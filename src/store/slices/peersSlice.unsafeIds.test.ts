import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {} } }));

import peersSlice, { peersActions } from './peersSlice';

const reducer = peersSlice.reducer;
const prototypeKeys = () => Object.getOwnPropertyNames(Object.prototype).sort();
const before = prototypeKeys();

afterEach(() => {
	expect(prototypeKeys()).toEqual(before);
	expect(({} as Record<string, unknown>).moderator).toBeUndefined();
});

describe('a peer id that names an Object.prototype property', () => {
	const joined = reducer(undefined, peersActions.addPeer({ id: 'p', sessionId: 's', displayName: 'Ola' }));

	it.each([ '__proto__', 'constructor', 'toString' ])('%s is not stored as a peer', (id) => {
		const state = reducer(joined, peersActions.addPeers([ { id, sessionId: 's', displayName: 'x' } ]));

		expect(Object.keys(reducer(state, peersActions.addPeer({ id, sessionId: 's', displayName: 'x' })))).toEqual([ 'p' ]);
	});

	it.each([ '__proto__', 'constructor' ])('%s updates nothing and throws nothing', (id) => {
		let state = reducer(joined, peersActions.updatePeer({ id, moderator: true, raisedHand: true, recording: true }));

		state = reducer(state, peersActions.setPeerSessionId({ id, sessionId: 'x', oldSessionId: 's' }));
		state = reducer(state, peersActions.updateTranscript({ id: 't1', peerId: id, transcript: 't', done: true }));
		state = reducer(state, peersActions.clearTranscripts(id));
		state = reducer(state, peersActions.removePeer({ id }));

		expect(Object.keys(state)).toEqual([ 'p' ]);
		expect(state.p.moderator).toBeUndefined();
	});

	it('a real peer is still updated', () => {
		const state = reducer(joined, peersActions.updatePeer({ id: 'p', moderator: true }));

		expect(state.p.moderator).toBe(true);
	});

	it('a picture that is not a string is not taken over', () => {
		const state = reducer(joined, peersActions.updatePeer({ id: 'p', picture: 1 as unknown as string }));

		expect(state.p.picture).toBeUndefined();
	});
});
