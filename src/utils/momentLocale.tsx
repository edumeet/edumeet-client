// Pre-bundled file that registers ALL moment locales in one shot. We tried 21 separate
// `import 'moment/locale/<code>'` side-effect imports first — those work in dev but
// Vite's production bundler dropped them silently, so `moment.locales()` returned just
// ['en'] in production builds. This single import is one well-known file that Vite
// keeps verbatim, and it loads every locale moment ships.
import 'moment/min/locales';

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
