import { createIntl, createIntlCache } from 'react-intl';

export interface ILocale {
	name: string;
	file: string;
	locale: string[];
	direction?: 'rtl';
	// The management server has no invitation e-mail template in this language.
	invitations?: false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	messages?: any;
}

export const localeList: ILocale[] = [
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
		locale: [ 'zh', 'zh-cn', 'zh-sg', 'zh-hans' ]
	}, // hans
	{
		name: 'Chinese (Traditional)',
		file: 'tw',
		locale: [ 'zh-tw', 'zh-hk', 'zh-mo', 'zh-hant' ]
	}, // hant
	{
		name: 'Croatian',
		file: 'hr',
		locale: [ 'hr', 'hr-hr' ]
	},
	{
		name: 'Danish',
		file: 'dk',
		locale: [ 'da', 'da-dk' ]
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
		name: 'Hungarian (magyar)',
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
		locale: [ 'kk', 'kk-kz' ]
	},
	{
		name: 'Latvian',
		file: 'lv',
		locale: [ 'lv', 'lv-lv' ]
	},
	{
		name: 'Norwegian',
		file: 'nb',
		locale: [ 'nb', 'nb-no', 'no' ]
	},
	{
		name: 'Persian',
		file: 'fa',
		locale: [ 'fa', 'fa-ir' ],
		direction: 'rtl',
		invitations: false
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

// The exact tag first, then the language with its script or region, so zh-tw
// and zh-Hant-HK find Traditional Chinese, then the language alone, so a
// browser set to cs-CZ or pt-BR still gets Czech or Portuguese.
export const findLocale = (locale: string): ILocale | undefined => {
	const [ language, ...subtags ] = locale
		.toLowerCase()
		.replace(/_/g, '-')
		.split('-');
	const candidates = [ [ language, ...subtags ].join('-'), ...subtags.map((subtag) => `${language}-${subtag}`), language ];

	for (const candidate of candidates) {
		const entry = localeList.find(({ locale: codes }) => codes.includes(candidate));

		if (entry) return entry;
	}

	return undefined;
};

export const isRtlLocale = (locale?: string): boolean =>
	locale !== undefined && findLocale(locale)?.direction === 'rtl';

export const invitationLocales = localeList.filter((entry) => entry.invitations !== false);

const cache = createIntlCache();

export let intl = createIntl({
	locale: 'en-US',
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
		const found = findLocale(locale);

		if (!found) throw new Error(`No translation for ${locale}`);

		res = found;
		res.messages = await import(`../translations/${res.file}.json`);
	} catch {
		res = localeList.filter((item) => item.locale.includes('en'))[0];
		res.messages = await import(`../translations/${res.file}.json`);
	}

	intl = createIntl({
		locale: res.locale[0],
		messages: res.messages.default,
	}, cache);

	return res.locale[0];
};
