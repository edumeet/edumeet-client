import { createIntl, createIntlCache } from 'react-intl';
import enLocale from '../translations/en.json';

export interface ILocale {
	name: string;
	file: string;
	locale: string[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	messages?: any;
}

export const localeList = [
	{
		name: 'English',
		file: 'en',
		locale: [ 'en', 'en-en' ]
	},
	{
		name: 'Czech',
		file: 'cs',
		locale: [ 'cs', 'cs-cs' ]
	},
	{
		name: 'Chinese (Simplified)',
		file: 'cn',
		locale: [ 'zn', 'zn-zn', 'zn-cn' ]
	}, // hans
	{
		name: 'Chinese (Traditional)',
		file: 'tw',
		locale: [ 'zn-tw', 'zn-hk', 'zn-sg' ]
	}, // hant
	{
		name: 'Croatian',
		file: 'hr',
		locale: [ 'hr', 'hr-hr' ]
	},
	{
		name: 'Danish',
		file: 'dk',
		locale: [ 'dk', 'dk-dk' ]
	},
	{
		name: 'French',
		file: 'fr',
		locale: [ 'fr', 'fr-fr' ]
	},
	{
		name: 'German',
		file: 'de',
		locale: [ 'de', 'de-de' ]
	},
	{
		name: 'Greek',
		file: 'el',
		locale: [ 'el', 'el-el' ]
	},
	{
		name: 'Hindi',
		file: 'hi',
		locale: [ 'hi', 'hi-hi' ]
	},
	{
		name: 'Hungarian',
		file: 'hu',
		locale: [ 'hu', 'hu-hu' ]
	},
	{
		name: 'Italian',
		file: 'it',
		locale: [ 'it', 'it-it' ]
	},
	{
		name: 'Kazakh',
		file: 'kk',
		locale: [ 'kk', 'kk-kz	' ]
	},
	{
		name: 'Latvian',
		file: 'lv',
		locale: [ 'lv', 'lv-lv' ]
	},
	{
		name: 'Norwegian',
		file: 'nb',
		locale: [ 'nb', 'nb-no' ]
	},
	{
		name: 'Polish',
		file: 'pl',
		locale: [ 'pl', 'pl-pl' ]
	},
	{
		name: 'Portuguese',
		file: 'pt',
		locale: [ 'pt', 'pt-pt' ]
	},
	{
		name: 'Romanian',
		file: 'ro',
		locale: [ 'ro', 'ro-ro' ]
	},
	{
		name: 'Russian',
		file: 'ru',
		locale: [ 'ru', 'ru-ru' ]
	},
	{
		name: 'Spanish',
		file: 'es',
		locale: [ 'es', 'es-es' ]
	},
	{
		name: 'Turkish',
		file: 'tr',
		locale: [ 'tr', 'tr-tr' ]
	},
	{
		name: 'Ukrainian',
		file: 'uk',
		locale: [ 'uk', 'uk-uk' ]
	}
];

const cache = createIntlCache();

export let intl = createIntl({
	locale: 'en-US',
	messages: enLocale
}, cache);

/**
 * Detect the browser language.
 * 
 * @returns {string} The browser locale
 */
export const detect = (): string => {
	const localeFull =
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(navigator.language || (navigator as any).browserLanguage).toLowerCase();

	return localeFull;
};

/**
 * Change the locale.
 * 
 * @param {string} locale The locale to change to
 * @returns {Promise<string>} The locale
 */
export const loadLocale = async (locale: string): Promise<string> => {
	let res: ILocale;

	try {
		res = localeList.filter((item) => item.locale.includes(locale))[0];
		res.messages = await import(`../translations/${res.file}`);
	} catch {
		res = localeList.filter((item) => item.locale.includes('en'))[0];
		res.messages = await import(`../translations/${res.file}`);
	}

	intl = createIntl({
		locale: res.locale[0],
		messages: res.messages
	}, cache);

	return res.locale[0];
};