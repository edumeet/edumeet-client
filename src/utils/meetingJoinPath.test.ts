import { describe, expect, it } from 'vitest';
import { meetingJoinPath } from './meetingToken';
import type { Meeting, Room } from './types';

const meeting = (room?: Partial<Room>, meetingToken = 'ABCDEFGHJKLM'): Meeting => ({
	roomId: 1,
	title: 'Board',
	startsAt: 0,
	endsAt: 1,
	timezone: 'UTC',
	locale: 'en',
	meetingToken,
	room: room as Room
});

describe('meetingJoinPath', () => {
	it('adds the token when the room admits meetings only', () => {
		expect(meetingJoinPath(meeting({ name: 'board', meetingsOnly: true }))).toBe('/board?meetingToken=ABCDEFGHJKLM');
	});

	it('accepts the 1 that MySQL returns for the flag', () => {
		expect(meetingJoinPath(meeting({ name: 'board', meetingsOnly: 1 as unknown as boolean }))).toBe('/board?meetingToken=ABCDEFGHJKLM');
	});

	it('opens the bare room otherwise', () => {
		expect(meetingJoinPath(meeting({ name: 'board', meetingsOnly: false }))).toBe('/board');
		expect(meetingJoinPath(meeting({ name: 'board', meetingsOnly: 0 as unknown as boolean }))).toBe('/board');
		expect(meetingJoinPath(meeting({ name: 'board' }))).toBe('/board');
	});

	it('does not invent a token when the meeting has none', () => {
		const tokenless = meeting({ name: 'board', meetingsOnly: true });

		delete tokenless.meetingToken;
		expect(meetingJoinPath(tokenless)).toBe('/board');
	});

	it('degrades to the root when the room is unknown', () => {
		expect(meetingJoinPath(meeting(undefined))).toBe('/');
	});
});
