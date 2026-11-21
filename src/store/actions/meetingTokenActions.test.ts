import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { meetingTokenRejected } from './meetingTokenActions';
import { MEETING_TOKEN_REJECTION_KEY, MeetingTokenRejection } from '../../utils/meetingToken';

const makeStorage = () => {
	const items = new Map<string, string>();

	return {
		items,
		getItem: (k: string) => items.get(k) ?? null,
		setItem: (k: string, v: string) => { items.set(k, v); },
		removeItem: (k: string) => { items.delete(k); }
	};
};

const run = (reason: MeetingTokenRejection, meetingToken?: string, data?: { startsAt?: unknown, endsAt?: unknown }) => {
	const dispatch = vi.fn();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(meetingTokenRejected(reason, data) as any)(dispatch, () => ({ me: { meetingToken } }), {});

	return dispatch;
};

describe('meetingTokenRejected', () => {
	const reload = vi.fn();
	let storage: ReturnType<typeof makeStorage>;

	beforeEach(() => {
		storage = makeStorage();
		vi.stubGlobal('sessionStorage', storage);
		vi.stubGlobal('window', { location: { reload } });
	});
	afterEach(() => {
		vi.unstubAllGlobals();
		reload.mockClear();
	});

	it('remembers the reason and the token that was tried, then reloads the page', () => {
		const dispatch = run('invalid', 'BAD');

		expect(JSON.parse(storage.items.get(MEETING_TOKEN_REJECTION_KEY) ?? '{}')).toEqual({ reason: 'invalid', meetingToken: 'BAD' });
		expect(reload).toHaveBeenCalledTimes(1);
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('still reloads when there was no token at all', () => {
		run('required');

		expect(JSON.parse(storage.items.get(MEETING_TOKEN_REJECTION_KEY) ?? '{}')).toEqual({ reason: 'required' });
		expect(reload).toHaveBeenCalledTimes(1);
	});

	it('keeps the meeting times of a token refused too early or too late', () => {
		run('early', 'GOOD', { reason: 'early', startsAt: 1000, endsAt: 2000 } as never);

		expect(JSON.parse(storage.items.get(MEETING_TOKEN_REJECTION_KEY) ?? '{}')).toEqual({ reason: 'early', meetingToken: 'GOOD', startsAt: 1000, endsAt: 2000 });
	});

	it('drops times that are not numbers', () => {
		run('over', 'GOOD', { startsAt: '1000', endsAt: null });

		expect(JSON.parse(storage.items.get(MEETING_TOKEN_REJECTION_KEY) ?? '{}')).toEqual({ reason: 'over', meetingToken: 'GOOD' });
	});

	it('reloads even when storage is unavailable, so the user is never left hanging', () => {
		vi.stubGlobal('sessionStorage', { setItem: () => { throw new Error('blocked'); } });

		run('required');

		expect(reload).toHaveBeenCalledTimes(1);
	});
});
