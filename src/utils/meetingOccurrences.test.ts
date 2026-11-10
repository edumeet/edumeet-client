import { describe, expect, it } from 'vitest';
import { isMeetingOver, nextOccurrenceStart } from './meetingOccurrences';

// Weekly at 12:00 Warsaw from Wednesday 14 October 2026; Warsaw leaves DST on 25 October
const weekly = {
	startsAt: Date.UTC(2026, 9, 14, 10, 0),
	endsAt: Date.UTC(2026, 9, 14, 11, 0),
	timezone: 'Europe/Warsaw',
	rrule: 'FREQ=WEEKLY;INTERVAL=1;COUNT=4'
};

describe('nextOccurrenceStart', () => {
	it('returns the start itself for a one-off meeting still ahead', () => {
		const single = { startsAt: 5000, endsAt: 6000 };

		expect(nextOccurrenceStart(single, 1000)).toBe(5000);
		expect(nextOccurrenceStart(single, 5000)).toBe(5000);
		expect(nextOccurrenceStart(single, 5001)).toBe(0);
	});

	it('keeps a weekly meeting at the same local time across the DST change', () => {
		// before the change 12:00 Warsaw is 10:00Z, after it 11:00Z
		expect(nextOccurrenceStart(weekly, Date.UTC(2026, 9, 15))).toBe(Date.UTC(2026, 9, 21, 10, 0));
		expect(nextOccurrenceStart(weekly, Date.UTC(2026, 9, 22))).toBe(Date.UTC(2026, 9, 28, 11, 0));
		expect(nextOccurrenceStart(weekly, Date.UTC(2026, 9, 29))).toBe(Date.UTC(2026, 10, 4, 11, 0));
	});

	it('treats an occurrence starting exactly now as upcoming', () => {
		expect(nextOccurrenceStart(weekly, Date.UTC(2026, 9, 21, 10, 0))).toBe(Date.UTC(2026, 9, 21, 10, 0));
	});

	it('returns 0 once the last occurrence has started', () => {
		expect(nextOccurrenceStart(weekly, Date.UTC(2026, 10, 4, 11, 1))).toBe(0);
	});

	it('expands in UTC when the meeting has no zone', () => {
		const zoneless = { ...weekly, timezone: undefined };

		expect(nextOccurrenceStart(zoneless, Date.UTC(2026, 9, 22))).toBe(Date.UTC(2026, 9, 28, 10, 0));
	});

	it('falls back to the plain start on a broken rule', () => {
		expect(nextOccurrenceStart({ ...weekly, rrule: 'FREQ=NONSENSE' }, 0)).toBe(weekly.startsAt);
	});
});

describe('isMeetingOver', () => {
	it('is over when a one-off meeting has ended', () => {
		const single = { startsAt: 5000, endsAt: 6000 };

		expect(isMeetingOver(single, 6000)).toBe(false);
		expect(isMeetingOver(single, 6001)).toBe(true);
	});

	it('is not over while a later occurrence remains', () => {
		expect(isMeetingOver(weekly, Date.UTC(2026, 9, 22))).toBe(false);
	});

	it('is not over while the last occurrence is in progress, at its local time', () => {
		// last occurrence: 4 November, 12:00-13:00 Warsaw = 11:00-12:00Z
		expect(isMeetingOver(weekly, Date.UTC(2026, 10, 4, 11, 30))).toBe(false);
		expect(isMeetingOver(weekly, Date.UTC(2026, 10, 4, 12, 0, 0, 1))).toBe(true);
	});
});

describe('rules the meeting dialog cannot write', () => {
	it('are shown as single meetings, without walking them', () => {
		const started = performance.now();
		const after = Date.UTC(2026, 9, 15);

		for (const rrule of [ 'FREQ=SECONDLY', 'FREQ=WEEKLY', 'FREQ=DAILY;BYMONTH=2;BYMONTHDAY=30;COUNT=1', 'FREQ=DAILY;BYHOUR=1,2;COUNT=5' ]) {
			const m = { ...weekly, rrule };

			expect(nextOccurrenceStart(m, after), rrule).toBe(0);
			expect(isMeetingOver(m, after), rrule).toBe(true);
		}

		// Starts before 2000, which the server refuses: yearly since 1970 would still be running.
		expect(isMeetingOver({ startsAt: 0, endsAt: 1000, rrule: 'FREQ=YEARLY;UNTIL=20991231' }, after)).toBe(true);
		expect(performance.now() - started).toBeLessThan(200);
	});
});

describe('a long series', () => {
	it('still finds the next occurrence of the longest rule the server accepts, quickly', () => {
		const daily = { startsAt: Date.UTC(2000, 0, 1, 10), endsAt: Date.UTC(2000, 0, 1, 11), rrule: 'FREQ=DAILY;UNTIL=20991231' };
		const now = Date.UTC(2026, 10, 10, 12);
		const started = performance.now();

		expect(nextOccurrenceStart(daily, now)).toBe(Date.UTC(2026, 10, 11, 10));
		expect(performance.now() - started).toBeLessThan(500);
		expect(isMeetingOver(daily, now)).toBe(false);
		expect(isMeetingOver(daily, Date.UTC(2026, 10, 10, 10, 30))).toBe(false);
	});
});
