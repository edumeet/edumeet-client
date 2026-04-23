export interface TimezoneOption {
	value: string;
	label: string;
	offsetMinutes: number;
}

// Computes the current UTC offset for an IANA time zone in minutes
// (handles DST automatically since it uses `new Date()`).
const offsetMinutesFor = (tz: string, at: Date): number => {
	try {
		const parts = new Intl.DateTimeFormat('en', {
			timeZone: tz,
			timeZoneName: 'longOffset',
			hour: '2-digit'
		}).formatToParts(at);
		const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
		const match = raw.match(/([+-])(\d{2}):(\d{2})/);

		if (!match) return 0;
		const sign = match[1] === '-' ? -1 : 1;

		return sign * ((parseInt(match[2], 10) * 60) + parseInt(match[3], 10));
	} catch {
		return 0;
	}
};

// Formats minutes as "+HH:MM" / "-HH:MM"
const formatOffset = (minutes: number): string => {
	const sign = minutes < 0 ? '-' : '+';
	const abs = Math.abs(minutes);
	const h = String(Math.floor(abs / 60)).padStart(2, '0');
	const m = String(abs % 60).padStart(2, '0');

	return `${sign}${h}:${m}`;
};

// Precomputes the sorted timezone list once at module load.
// `Intl.supportedValuesOf('timeZone')` is widely supported (Chrome 99+, FF 93+, Safari 15.4+, Node 18+).
const buildOptions = (): TimezoneOption[] => {
	let zones: string[] = [];

	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const supported = (Intl as any).supportedValuesOf;

		if (typeof supported === 'function') zones = supported('timeZone');
	} catch {
		zones = [];
	}

	if (zones.length === 0) {
		// minimal fallback when Intl.supportedValuesOf isn't available
		zones = [ 'UTC', 'Europe/London', 'Europe/Berlin', 'Europe/Warsaw', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney' ];
	}

	const now = new Date();
	const options = zones.map((tz) => {
		const offset = offsetMinutesFor(tz, now);

		return {
			value: tz,
			label: `${tz} (${formatOffset(offset)})`,
			offsetMinutes: offset
		};
	});

	options.sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.value.localeCompare(b.value));

	return options;
};

export const timezoneOptions: TimezoneOption[] = buildOptions();

export const browserTimezone = (): string => {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	} catch {
		return 'UTC';
	}
};
