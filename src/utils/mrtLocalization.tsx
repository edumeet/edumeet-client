import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
// eslint-disable-next-line camelcase
import type { MRT_Localization } from 'material-react-table';

// Map app locale file codes to MRT locale directory names.
// Only add entries where the app code differs from the MRT directory name.
// If the app code matches the MRT directory (e.g. 'fr' -> 'fr'), no entry needed.
const mrtLocaleDir: Record<string, string> = {
	cn: 'zh-Hans',
	tw: 'zh-Hant',
	dk: 'da',
	nb: 'no',
};

const getMRTDir = (appLocale: string): string =>
	mrtLocaleDir[appLocale] ?? appLocale;

// eslint-disable-next-line camelcase
let fallback: MRT_Localization | undefined;

// eslint-disable-next-line camelcase
const cache: Record<string, MRT_Localization> = {};

// eslint-disable-next-line camelcase
async function loadLocalization(appLocale: string): Promise<MRT_Localization | undefined> {
	const dir = getMRTDir(appLocale);

	if (cache[dir]) return cache[dir];

	try {
		const mod = await import(`material-react-table/locales/${dir}`);
		// MRT exports are named MRT_Localization_XX — grab the first export
		const key = Object.keys(mod).find((k) => k.startsWith('MRT_Localization'));
		const localization = key ? mod[key] : undefined;

		if (localization) {
			cache[dir] = localization;

			return localization;
		}
	} catch {
		// MRT locale not available for this language
	}

	return undefined;
}

// eslint-disable-next-line camelcase
export const useMRTLocalization = (): MRT_Localization | undefined => {
	const locale = useAppSelector((state) => state.settings.locale);
	// eslint-disable-next-line camelcase
	const [ localization, setLocalization ] = useState<MRT_Localization | undefined>(
		locale ? cache[getMRTDir(locale)] : undefined
	);

	useEffect(() => {
		if (!fallback) {
			loadLocalization('en').then((loc) => {
				fallback = loc;
				if (!localization) setLocalization(fallback);
			});
		}

		if (!locale) {
			setLocalization(fallback);

			return;
		}

		const cached = cache[getMRTDir(locale)];

		if (cached) {
			setLocalization(cached);

			return;
		}

		loadLocalization(locale).then((loc) => {
			setLocalization(loc ?? fallback);
		});
	}, [ locale ]);

	return localization ?? fallback;
};
