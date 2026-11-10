import { RRule, rrulestr } from 'rrule';
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

// The same limits as the management server's own expansion (meetingWindow), so a rule from
// another client or an older server cannot stall every row of the meeting list: rules the
// meeting dialog cannot write are shown as single meetings, and the walk is bounded.
const MEETING_TIME_MIN = Date.UTC(2000, 0, 1);
const MAX_OCCURRENCES = 20000;
const LOOKAHEAD_MS = 2 * 366 * 24 * 60 * 60 * 1000;
const UNSUPPORTED_PARTS = [ 'bymonth', 'bymonthday', 'bysetpos', 'byyearday', 'byweekno', 'byhour', 'byminute', 'bysecond', 'byeaster' ] as const;

const isSupported = (rule: RRule): boolean => {
	const o = rule.origOptions;

	return o.freq !== undefined && o.freq <= RRule.DAILY &&
		(o.count != null || o.until != null) &&
		UNSUPPORTED_PARTS.every((part) => o[part] == null || (Array.isArray(o[part]) && (o[part] as unknown[]).length === 0));
};

interface Walk {
	next?: number;
	last?: number;
	tooMany: boolean;
}

// One pass over the occurrences up to the first one at or after `now`; null for a meeting
// that is treated as a single one. Throws on a rule rrule cannot parse.
const walk = (m: OccurrenceSource, now: number): Walk | null => {
	const startsAt = Number(m.startsAt);

	if (!m.rrule || startsAt < MEETING_TIME_MIN) return null;

	const tz = zoneOf(m);
	const parsed = rrulestr(m.rrule, { dtstart: asFloating(startsAt, tz) });

	if (!(parsed instanceof RRule) || !isSupported(parsed)) return null;

	const nowFloating = asFloating(now, tz).getTime();
	const horizon = new Date(nowFloating + LOOKAHEAD_MS);
	const until = parsed.options.until && parsed.options.until < horizon ? parsed.options.until : horizon;
	const rule = new RRule({ ...parsed.origOptions, dtstart: parsed.options.dtstart, until });
	let next: Date | undefined;
	let last: Date | undefined;
	let seen = 0;

	rule.all((date) => {
		if (date.getTime() >= nowFloating) {
			next = date;

			return false;
		}
		last = date;

		return ++seen < MAX_OCCURRENCES;
	});

	return {
		next: next && fromFloating(next, tz),
		last: last && fromFloating(last, tz),
		tooMany: !next && seen >= MAX_OCCURRENCES
	};
};

// Start of the first occurrence at or after `now`, or 0 when none is left.
export const nextOccurrenceStart = (m: OccurrenceSource, now: number): number => {
	const startsAt = Number(m.startsAt);

	try {
		const w = walk(m, now);

		if (!w) return startsAt >= now ? startsAt : 0;

		return w.next ?? 0;
	} catch {
		return startsAt >= now ? startsAt : 0;
	}
};

// A meeting is over only when nothing is left: no occurrence starts at or after `now` and
// the last one that did start has already ended.
export const isMeetingOver = (m: OccurrenceSource, now: number): boolean => {
	const startsAt = Number(m.startsAt);
	const endsAt = Number(m.endsAt);

	try {
		const w = walk(m, now);

		if (!w) return endsAt < now;
		if (w.next !== undefined) return false;
		if (w.tooMany) return true;
		if (w.last === undefined) return true;

		return w.last + (endsAt - startsAt) < now;
	} catch {
		return endsAt < now;
	}
};
