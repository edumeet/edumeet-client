import { localeList } from './intlManager';

export type Direction = 'ltr' | 'rtl';

/** Resolve the document direction from a BCP 47 locale tag. */
export const getDirection = (locale: string | undefined): Direction => {
	const normalizedLocale = (locale || 'en').toLowerCase().replace('_', '-');
	const language = normalizedLocale.split('-')[0];
	const localeEntry = localeList.find((entry) => entry.locale.some((value) => {
		const normalizedValue = value.toLowerCase().replace('_', '-');

		return normalizedValue === normalizedLocale || normalizedValue.split('-')[0] === language;
	}));

	return localeEntry?.direction || 'ltr';
};
