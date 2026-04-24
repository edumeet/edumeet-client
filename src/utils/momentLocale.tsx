import moment from 'moment';

// Our translation file codes don't always match moment locale codes.
// Moment uses IETF tags (zh-cn, zh-tw, da); our localeList uses shorter custom codes.
const MOMENT_LOCALE_MAP: Record<string, string> = {
	cn: 'zh-cn',
	tw: 'zh-tw',
	dk: 'da',
};

export const toMomentLocale = (fileCode: string | undefined): string => {
	if (!fileCode) return 'en';

	return MOMENT_LOCALE_MAP[fileCode] ?? fileCode;
};

// Dynamically loads the moment locale bundle and sets it as active.
// No-op for 'en' (always preloaded in moment). Silently falls back to 'en'
// if the locale bundle isn't available.
export const ensureMomentLocale = async (fileCode: string | undefined): Promise<string> => {
	const target = toMomentLocale(fileCode);

	if (target === 'en') {
		moment.locale('en');

		return 'en';
	}
	try {
		// @vite-ignore
		await import(`moment/locale/${target}.js`);
		moment.locale(target);

		return target;
	} catch {
		moment.locale('en');

		return 'en';
	}
};
