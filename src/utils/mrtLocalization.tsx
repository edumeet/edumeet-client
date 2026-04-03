import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
// eslint-disable-next-line camelcase
import type { MRT_Localization } from 'material-react-table';

// eslint-disable-next-line camelcase
type LocaleLoader = () => Promise<MRT_Localization>;

// Each entry maps an app locale code to a lazy loader for its MRT localization.
// To add a new language: add one line here. No other changes needed.
const loaders: Record<string, LocaleLoader> = {
	en: () => import('material-react-table/locales/en').then((m) => m.MRT_Localization_EN),
	cs: () => import('material-react-table/locales/cs').then((m) => m.MRT_Localization_CS),
	cn: () => import('material-react-table/locales/zh-Hans').then((m) => m.MRT_Localization_ZH_HANS),
	tw: () => import('material-react-table/locales/zh-Hant').then((m) => m.MRT_Localization_ZH_HANT),
	hr: () => import('material-react-table/locales/hr').then((m) => m.MRT_Localization_HR),
	dk: () => import('material-react-table/locales/da').then((m) => m.MRT_Localization_DA),
	fr: () => import('material-react-table/locales/fr').then((m) => m.MRT_Localization_FR),
	de: () => import('material-react-table/locales/de').then((m) => m.MRT_Localization_DE),
	el: () => import('material-react-table/locales/el').then((m) => m.MRT_Localization_EL),
	hu: () => import('material-react-table/locales/hu').then((m) => m.MRT_Localization_HU),
	it: () => import('material-react-table/locales/it').then((m) => m.MRT_Localization_IT),
	nb: () => import('material-react-table/locales/no').then((m) => m.MRT_Localization_NO),
	pl: () => import('material-react-table/locales/pl').then((m) => m.MRT_Localization_PL),
	pt: () => import('material-react-table/locales/pt').then((m) => m.MRT_Localization_PT),
	ro: () => import('material-react-table/locales/ro').then((m) => m.MRT_Localization_RO),
	ru: () => import('material-react-table/locales/ru').then((m) => m.MRT_Localization_RU),
	es: () => import('material-react-table/locales/es').then((m) => m.MRT_Localization_ES),
	tr: () => import('material-react-table/locales/tr').then((m) => m.MRT_Localization_TR),
	uk: () => import('material-react-table/locales/uk').then((m) => m.MRT_Localization_UK),
};

// eslint-disable-next-line camelcase
const cache: Record<string, MRT_Localization> = {};

// eslint-disable-next-line camelcase
export const useMRTLocalization = (): MRT_Localization | undefined => {
	const locale = useAppSelector((state) => state.settings.locale);
	// eslint-disable-next-line camelcase
	const [ localization, setLocalization ] = useState<MRT_Localization | undefined>(
		locale ? cache[locale] : undefined
	);

	useEffect(() => {
		const key = locale ?? 'en';

		if (cache[key]) {
			setLocalization(cache[key]);

			return;
		}

		const loader = loaders[key] ?? loaders.en;

		loader().then((loc) => {
			cache[key] = loc;
			setLocalization(loc);
		});
	}, [ locale ]);

	return localization;
};
