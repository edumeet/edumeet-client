// Keep styling aligned with BreezeShot's default initials avatar:
// - backgroundColor: theme.palette.customColors.avatarBg (light mode: #DBDADE)
// - color: theme.palette.text.secondary (rgba(mainColor, 0.68), mainColor = 47,43,61)
const AVATAR_BG = '#DBDADE';
// Use a solid hex in SVG text fill for reliable rendering across browsers.
const AVATAR_FG = '#5F5B6B';
const BREEZESHOT_API_BASE_URL = 'https://api.breezeshot.com';

export const getInitialLetter = (name?: string): string => {
	const value = (name ?? '').trim();

	if (!value) return '?';

	return value.charAt(0).toUpperCase();
};

export const makeLetterAvatarSrc = (letter: string): string => {
	const safeLetter = getInitialLetter(letter);
	const circleRadius = 20; // keep smaller than full canvas, but clearly visible
	const fontSize = 20;

	// Inline SVG as a "picture" so we can use it anywhere an <img> src or CSS background-image is needed.
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
			<circle cx="24" cy="24" r="${circleRadius}" fill="${AVATAR_BG}" />
			<text x="24" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="${AVATAR_FG}" dominant-baseline="central">
				${safeLetter}
			</text>
		</svg>
	`.trim();

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const makeLetterAvatarSrcFromName = (name?: string): string => makeLetterAvatarSrc(getInitialLetter(name));

/** Encode each path segment (handles spaces/special chars in filenames like BreezeShot uploads). */
const encodeUrlPathSegments = (pathname: string): string =>
	pathname
		.split('/')
		.map((seg) => (seg ? encodeURIComponent(seg) : ''))
		.join('/');

export const resolveBreezeshotAvatarUrl = (
	imageUrl?: string,
	baseUrl: string = BREEZESHOT_API_BASE_URL
): string => {
	const value = (imageUrl ?? '').trim();

	if (!value) return '';

	let resolved: string;

	if (value.startsWith('http://') || value.startsWith('https://')) {
		try {
			const u = new URL(value);

			u.pathname = encodeUrlPathSegments(u.pathname);
			resolved = u.toString();
		} catch {
			resolved = encodeURI(value);
		}
	} else {
		const path = value.startsWith('/') ? value : `/${value}`;

		resolved = `${baseUrl.replace(/\/+$/, '')}${encodeUrlPathSegments(path)}`;
	}

	return resolved;
};

/**
 * BreezeShot `User` exposes profile image as `imageUrl` (users.model.ts).
 * validate-token / validate-edumeet-room return that user object as `user`.
 */
export const getBreezeshotUserProfilePicture = (user: unknown): string => {
	if (!user || typeof user !== 'object') return '';

	const u = user as Record<string, unknown>;

	const primary = u.imageUrl;

	if (typeof primary === 'string' && primary.trim()) return primary.trim();

	for (const c of [ u.imageURL, u.image_url, u.picture, u.avatarUrl, u.avatar, u.profileImageUrl ]) {
		if (typeof c === 'string' && c.trim()) return c.trim();
	}

	return '';
};

/**
 * Extract the best available display name from BreezeShot user payloads.
 * BreezeShot uses `username` as the public handle ("nickname"); prefer it over firstName/lastName.
 */
export const getBreezeshotUserDisplayName = (user: unknown): string => {
	if (!user || typeof user !== 'object') return '';

	const u = user as Record<string, unknown>;
	const isPlaceholder = (value?: string): boolean => {
		const name = (value ?? '').trim();

		if (!name) return true;
		if (/^hello\d+$/i.test(name)) return true;
		if (/^guest(?:\s+user)?$/i.test(name)) return true;

		return false;
	};
	const firstString = (...values: unknown[]): string =>
		values.find((value) => typeof value === 'string' && value.trim()) as string || '';
	const pickMeaningful = (value: string): string | undefined => {
		const trimmed = value.trim();

		if (!trimmed || isPlaceholder(trimmed)) return undefined;

		return trimmed;
	};
	const pickFromRecord = (record: Record<string, unknown>): string => {
		const handle = pickMeaningful(firstString(
			record.nickname,
			record.nick_name,
			record.username,
			record.userName
		));

		if (handle) return handle;

		const display = pickMeaningful(firstString(record.displayName, record.display_name));

		if (display) return display;

		const full = pickMeaningful(firstString(record.fullName, record.full_name, record.name));

		if (full) return full;

		const first = firstString(record.firstName, record.first_name);
		const last = firstString(record.lastName, record.last_name);
		const combined = `${first.trim()} ${last.trim()}`.trim();

		return combined;
	};
	const nested = [
		u.user,
		u.profile,
		u.attributes,
		u.data,
		typeof u.userData === 'object' ? u.userData : undefined
	].filter((value): value is Record<string, unknown> => Boolean(value && typeof value === 'object'));

	const direct = pickFromRecord(u);

	if (direct) return direct;

	for (const n of nested) {
		const nestedName = pickFromRecord(n);

		if (nestedName) return nestedName;
	}

	return '';
};
