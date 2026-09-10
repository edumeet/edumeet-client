import { rrulestr } from 'rrule';
import { instantToWallClock, wallClockToInstant, WallClock } from './timezones';

export interface OccurrenceSource {
	startsAt: number | string;
	endsAt: number | string;
	timezone?: string;
	rrule?: string;
}

// rrule expands on the UTC fields of the dates it is given. Feeding it the meeting zone's
// wall clock as if it were UTC keeps every occurrence at the same local time across a DST
// change, which is what the invite's TZID-based RRULE promises the guests. The results are
// wall clocks in the same disguise and are converted back to instants here.
const asFloating = (ms: number, tz: string): Date => {
	const w = instantToWallClock(ms, tz);

	return new Date(Date.UTC(w.year, w.month, w.day, w.hour, w.minute));
};

const fromFloating = (d: Date, tz: string): number => {
	const w: WallClock = {
		year: d.getUTCFullYear(),
		month: d.getUTCMonth(),
		day: d.getUTCDate(),
		hour: d.getUTCHours(),
		minute: d.getUTCMinutes()
	};

	return wallClockToInstant(w, tz);
};

const zoneOf = (m: OccurrenceSource): string => m.timezone || 'UTC';

// Start of the first occurrence at or after `now`, or 0 when none is left.
export const nextOccurrenceStart = (m: OccurrenceSource, now: number): number => {
	const startsAt = Number(m.startsAt);

	if (!m.rrule) return startsAt >= now ? startsAt : 0;
	const tz = zoneOf(m);

	try {
		const rule = rrulestr(m.rrule, { dtstart: asFloating(startsAt, tz) });
		const next = rule.after(asFloating(now, tz), true);

		return next ? fromFloating(next, tz) : 0;
	} catch {
		return startsAt >= now ? startsAt : 0;
	}
};

// A meeting is over only when nothing is left: no occurrence starts at or after `now` and
// the last one that did start has already ended.
export const isMeetingOver = (m: OccurrenceSource, now: number): boolean => {
	const startsAt = Number(m.startsAt);
	const endsAt = Number(m.endsAt);
	const duration = endsAt - startsAt;

	if (!m.rrule) return endsAt < now;
	const tz = zoneOf(m);

	try {
		const rule = rrulestr(m.rrule, { dtstart: asFloating(startsAt, tz) });

		if (rule.after(asFloating(now, tz), true)) return false;
		const last = rule.before(asFloating(now, tz), true);

		if (!last) return true;

		return fromFloating(last, tz) + duration < now;
	} catch {
		return endsAt < now;
	}
};
