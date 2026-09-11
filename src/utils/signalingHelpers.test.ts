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
});
