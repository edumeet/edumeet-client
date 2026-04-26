// Note: moment is aliased in vite.config.ts to `moment/min/moment-with-locales`,
// which ships every locale pre-registered. We don't need any side-effect imports here.
// The alias also redirects @mui/x-date-pickers/AdapterMoment's internal `require('moment')`,
// so it sees the same instance with the same locales registered.

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
