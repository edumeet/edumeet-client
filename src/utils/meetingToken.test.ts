import { describe, expect, it } from 'vitest';
import { meetingTokenFromUrl, normalizeMeetingToken, roomPathWithMeetingToken } from './meetingToken';

describe('normalizeMeetingToken', () => {
	it('trims and uppercases a typed token', () => {
		expect(normalizeMeetingToken('  abcdefghjklm ')).toBe('ABCDEFGHJKLM');
	});

	it('treats blank and missing input as no token', () => {
		expect(normalizeMeetingToken('')).toBeUndefined();
		expect(normalizeMeetingToken('   ')).toBeUndefined();
		expect(normalizeMeetingToken(null)).toBeUndefined();
		expect(normalizeMeetingToken(undefined)).toBeUndefined();
	});
});

describe('meetingTokenFromUrl', () => {
	it('reads the token from the room link', () => {
		expect(meetingTokenFromUrl('https://meet.example.edu/board?meetingToken=abcdefghjklm')).toBe('ABCDEFGHJKLM');
	});

	it('is absent on a plain room link', () => {
		expect(meetingTokenFromUrl('https://meet.example.edu/board')).toBeUndefined();
		expect(meetingTokenFromUrl('https://meet.example.edu/board?displayName=Ann')).toBeUndefined();
	});
});

describe('roomPathWithMeetingToken', () => {
	it('builds the plain path without a token', () => {
		expect(roomPathWithMeetingToken('board')).toBe('/board');
		expect(roomPathWithMeetingToken('board', undefined)).toBe('/board');
	});

	it('appends and encodes the token', () => {
		expect(roomPathWithMeetingToken('board', 'ABCDEFGHJKLM')).toBe('/board?meetingToken=ABCDEFGHJKLM');
		expect(roomPathWithMeetingToken('board', 'a&b')).toBe('/board?meetingToken=a%26b');
	});
});
