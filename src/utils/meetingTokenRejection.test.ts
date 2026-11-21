import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEETING_TOKEN_REJECTION_KEY, isMeetingClosed, meetingTokenWindow, storeMeetingTokenRejection, takeMeetingTokenRejection } from './meetingToken';

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

	it('carries the meeting times of a token refused too early or too late through the reload', () => {
		storeMeetingTokenRejection({ reason: 'early', meetingToken: 'GOOD', startsAt: 1000, endsAt: 2000 });

		expect(takeMeetingTokenRejection()).toEqual({ reason: 'early', meetingToken: 'GOOD', startsAt: 1000, endsAt: 2000 });
	});

	it('drops stored times that are not numbers', () => {
		storage.items.set(MEETING_TOKEN_REJECTION_KEY, JSON.stringify({ reason: 'over', startsAt: 'soon', endsAt: 2000 }));

		expect(takeMeetingTokenRejection()).toEqual({ reason: 'over', meetingToken: undefined, startsAt: undefined, endsAt: 2000 });
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

describe('closed meeting', () => {
	it('is closed only for a token refused too early or too late', () => {
		expect(isMeetingClosed('early')).toBe(true);
		expect(isMeetingClosed('over')).toBe(true);
		expect(isMeetingClosed('required')).toBe(false);
		expect(isMeetingClosed('invalid')).toBe(false);
		expect(isMeetingClosed(undefined)).toBe(false);
	});

	it('takes the meeting times only when they are numbers', () => {
		expect(meetingTokenWindow({ startsAt: 1000, endsAt: 2000 })).toEqual({ startsAt: 1000, endsAt: 2000 });
		expect(meetingTokenWindow({ startsAt: '1000', endsAt: Number.NaN })).toEqual({ startsAt: undefined, endsAt: undefined });
		expect(meetingTokenWindow(undefined)).toEqual({ startsAt: undefined, endsAt: undefined });
	});
});
