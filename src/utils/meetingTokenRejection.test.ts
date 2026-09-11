import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEETING_TOKEN_REJECTION_KEY, storeMeetingTokenRejection, takeMeetingTokenRejection } from './meetingToken';

const makeStorage = () => {
	const items = new Map<string, string>();

	return {
		items,
		getItem: (k: string) => items.get(k) ?? null,
		setItem: (k: string, v: string) => { items.set(k, v); },
		removeItem: (k: string) => { items.delete(k); }
	};
};

describe('stored meeting token rejection', () => {
	let storage: ReturnType<typeof makeStorage>;

	beforeEach(() => {
		storage = makeStorage();
		vi.stubGlobal('sessionStorage', storage);
	});
	afterEach(() => vi.unstubAllGlobals());

	it('survives a reload once and is consumed on read', () => {
		storeMeetingTokenRejection({ reason: 'invalid', meetingToken: 'BAD' });

		expect(takeMeetingTokenRejection()).toEqual({ reason: 'invalid', meetingToken: 'BAD' });
		expect(takeMeetingTokenRejection()).toBeUndefined();
		expect(storage.items.has(MEETING_TOKEN_REJECTION_KEY)).toBe(false);
	});

	it('is absent on a fresh page', () => {
		expect(takeMeetingTokenRejection()).toBeUndefined();
	});

	it('normalizes the stored token like any typed one', () => {
		storage.items.set(MEETING_TOKEN_REJECTION_KEY, JSON.stringify({ reason: 'required', meetingToken: ' abc ' }));

		expect(takeMeetingTokenRejection()).toEqual({ reason: 'required', meetingToken: 'ABC' });
	});

	it('ignores garbage in storage rather than crashing the join dialog', () => {
		storage.items.set(MEETING_TOKEN_REJECTION_KEY, '{not json');
		expect(takeMeetingTokenRejection()).toBeUndefined();

		storage.items.set(MEETING_TOKEN_REJECTION_KEY, JSON.stringify({ reason: 'nonsense' }));
		expect(takeMeetingTokenRejection()).toBeUndefined();
	});

	it('copes with storage that throws', () => {
		vi.stubGlobal('sessionStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });

		storeMeetingTokenRejection({ reason: 'required' });
		expect(takeMeetingTokenRejection()).toBeUndefined();
	});
});
