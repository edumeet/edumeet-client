import { describe, expect, it, vi } from 'vitest';

vi.mock('./edumeetConfig', () => ({ default: { serverHostname: 'rooms.example.edu', productionPort: 443, developmentPort: 8443 } }));

vi.stubGlobal('window', { location: { hostname: 'meet.example.edu' } });

import { getSignalingUrl } from './signalingHelpers';

describe('getSignalingUrl', () => {
	it('carries the meeting token so reconnects present it again', () => {
		const url = new URL(getSignalingUrl('p1', 'board', 'rk', undefined, 'ABCDEFGHJKLM'));

		expect(url.searchParams.get('meetingToken')).toBe('ABCDEFGHJKLM');
		expect(url.searchParams.get('roomId')).toBe('board');
		expect(url.searchParams.get('token')).toBeNull();
	});

	it('encodes the meeting token', () => {
		const url = new URL(getSignalingUrl('p1', 'board', 'rk', 'jwt', 'a&b'));

		expect(url.searchParams.get('meetingToken')).toBe('a&b');
		expect(url.searchParams.get('token')).toBe('jwt');
	});

	it('leaves the meeting token out when there is none', () => {
		expect(getSignalingUrl('p1', 'board', 'rk', 'jwt')).not.toContain('meetingToken');
	});

	it('tells the server about a headless page, and only then', () => {
		expect(new URL(getSignalingUrl('p1', 'board', 'rk', undefined, undefined, true)).searchParams.get('headless')).toBe('1');
		expect(getSignalingUrl('p1', 'board', 'rk', undefined, undefined, false)).not.toContain('headless');
		expect(getSignalingUrl('p1', 'board', 'rk', undefined)).not.toContain('headless');
	});
	it('carries the bot type for a headless page only', () => {
		expect(new URL(getSignalingUrl('p1', 'board', 'rk', undefined, undefined, true, 'recorder')).searchParams.get('botType')).toBe('recorder');
		expect(getSignalingUrl('p1', 'board', 'rk', undefined, undefined, false, 'recorder')).not.toContain('botType');
		expect(getSignalingUrl('p1', 'board', 'rk', undefined, undefined, true)).not.toContain('botType');
	});
	it('carries the breakout session for a headless page only', () => {
		expect(new URL(getSignalingUrl('p1', 'board', 'rk', undefined, undefined, true, 'recorder', 'sess-1')).searchParams.get('session')).toBe('sess-1');
		expect(getSignalingUrl('p1', 'board', 'rk', undefined, undefined, false, undefined, 'sess-1')).not.toContain('session');
	});
});
