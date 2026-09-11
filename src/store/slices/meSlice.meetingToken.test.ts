import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, askForMediaOnJoin: true, simulcast: true, simulcastSharing: true } }));
vi.mock('../../utils/deviceInfo', () => ({ deviceInfo: () => ({ name: 'test', version: '1', platform: 'test' }) }));

import meSlice, { meActions } from './meSlice';

describe('meSlice meeting token', () => {
	const reducer = meSlice.reducer;
	const initial = reducer(undefined, { type: 'init' });

	it('starts without a token or rejection', () => {
		expect(initial.meetingToken).toBeUndefined();
		expect(initial.meetingTokenRejection).toBeUndefined();
	});

	it('stores and clears the token', () => {
		const withToken = reducer(initial, meActions.setMeetingToken('ABCDEFGHJKLM'));

		expect(withToken.meetingToken).toBe('ABCDEFGHJKLM');
		expect(reducer(withToken, meActions.setMeetingToken(undefined)).meetingToken).toBeUndefined();
	});

	it('records why the server refused the token', () => {
		expect(reducer(initial, meActions.setMeetingTokenRejection('required')).meetingTokenRejection).toBe('required');
		expect(reducer(initial, meActions.setMeetingTokenRejection('invalid')).meetingTokenRejection).toBe('invalid');
	});

	it('keeps the token across a rejection so the user can correct it', () => {
		const state = reducer(reducer(initial, meActions.setMeetingToken('BAD')), meActions.setMeetingTokenRejection('invalid'));

		expect(state.meetingToken).toBe('BAD');
	});
});
