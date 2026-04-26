import moment from 'moment';

// Static imports register the locale with the same moment instance the app uses.
// Dynamic imports (`import('moment/locale/${x}.js')`) were unreliable: Vite couldn't
// always resolve the variable path at build time, the locale wouldn't end up in the
// bundle, and `moment.locale()` would silently fall back to 'en'.
//
// Each locale file is ~10KB minified; the full set adds ~200KB once. That's the cost
// of getting localized DateTimePicker formats reliably across all 22 supported UI locales.
import 'moment/locale/cs';
import 'moment/locale/da';
import 'moment/locale/de';
import 'moment/locale/el';
import 'moment/locale/es';
import 'moment/locale/fr';
import 'moment/locale/hi';
import 'moment/locale/hr';
import 'moment/locale/hu';
import 'moment/locale/it';
import 'moment/locale/kk';
import 'moment/locale/lv';
import 'moment/locale/nb';
import 'moment/locale/pl';
import 'moment/locale/pt';
import 'moment/locale/ro';
import 'moment/locale/ru';
import 'moment/locale/tr';
import 'moment/locale/uk';
import 'moment/locale/zh-cn';
import 'moment/locale/zh-tw';

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

// Sets the active moment locale. All bundles are statically imported above, so this
// always succeeds for any supported locale and there's no async work.
export const ensureMomentLocale = async (fileCode: string | undefined): Promise<string> => {
	const target = toMomentLocale(fileCode);

	moment.locale(target);

	// moment.locale() returns the active locale name; falls through to 'en' if unknown.
	return moment.locale();
};
