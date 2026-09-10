import { describe, expect, it } from 'vitest';
import { instantToWallClock, wallClockToInstant } from './timezones';

const T10Z = Date.UTC(2026, 8, 10, 10, 0);

describe('instantToWallClock', () => {
	it('renders one instant as each zone\'s own wall clock', () => {
		expect(instantToWallClock(T10Z, 'Europe/Warsaw')).toEqual({ year: 2026, month: 8, day: 10, hour: 12, minute: 0 });
		expect(instantToWallClock(T10Z, 'America/New_York')).toEqual({ year: 2026, month: 8, day: 10, hour: 6, minute: 0 });
		expect(instantToWallClock(T10Z, 'UTC')).toEqual({ year: 2026, month: 8, day: 10, hour: 10, minute: 0 });
	});

	it('crosses the date line when the zone does', () => {
		expect(instantToWallClock(Date.UTC(2026, 8, 10, 23, 30), 'Asia/Tokyo')).toEqual({ year: 2026, month: 8, day: 11, hour: 8, minute: 30 });
	});

	it('never yields hour 24 at midnight', () => {
		expect(instantToWallClock(Date.UTC(2026, 8, 10, 22, 0), 'Europe/Warsaw').hour).toBe(0);
	});
});

describe('wallClockToInstant', () => {
	it('turns a zone\'s wall clock into the instant it names', () => {
		expect(wallClockToInstant({ year: 2026, month: 8, day: 10, hour: 12, minute: 0 }, 'Europe/Warsaw')).toBe(T10Z);
		expect(wallClockToInstant({ year: 2026, month: 8, day: 10, hour: 6, minute: 0 }, 'America/New_York')).toBe(T10Z);
	});

	it('uses the offset in force on the meeting day, not today\'s', () => {
		// 25 October 2026 is the day Warsaw leaves DST
		const before = wallClockToInstant({ year: 2026, month: 9, day: 21, hour: 12, minute: 0 }, 'Europe/Warsaw');
		const after = wallClockToInstant({ year: 2026, month: 9, day: 28, hour: 12, minute: 0 }, 'Europe/Warsaw');

		expect(before).toBe(Date.UTC(2026, 9, 21, 10, 0));
		expect(after).toBe(Date.UTC(2026, 9, 28, 11, 0));
	});

	it('settles a wall clock right after a DST change', () => {
		expect(wallClockToInstant({ year: 2026, month: 9, day: 25, hour: 3, minute: 30 }, 'Europe/Warsaw')).toBe(Date.UTC(2026, 9, 25, 2, 30));
		expect(wallClockToInstant({ year: 2026, month: 2, day: 29, hour: 3, minute: 30 }, 'Europe/Warsaw')).toBe(Date.UTC(2026, 2, 29, 1, 30));
	});

	it('round-trips with instantToWallClock', () => {
		for (const tz of [ 'Europe/Warsaw', 'America/Los_Angeles', 'Asia/Kolkata', 'Australia/Sydney', 'UTC' ]) {
			expect(wallClockToInstant(instantToWallClock(T10Z, tz), tz)).toBe(T10Z);
		}
	});

	it('falls back to the browser zone consistently for an unknown zone', () => {
		expect(wallClockToInstant(instantToWallClock(T10Z, 'Not/AZone'), 'Not/AZone')).toBe(T10Z);
	});
});
