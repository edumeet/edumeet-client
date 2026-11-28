import { createIntl, createIntlCache } from 'react-intl';

export interface ILocale {
	nativeName: string;
	file: string;
	locale: string[];
	tag?: string;
	direction?: 'rtl';
	// The management server has no invitation e-mail template in this language.
	invitations?: false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	messages?: any;
}

export const localeList: ILocale[] = [
	{
		nativeName: 'Čeština',
		file: 'cs',
		locale: [ 'cs', 'cs-cs' ]
	},
	{
		nativeName: 'Dansk',
		file: 'dk',
		locale: [ 'da', 'da-dk' ]
	},
	{
		nativeName: 'Deutsch',
		file: 'de',
		locale: [ 'de', 'de-de' ]
	},
	{
		nativeName: 'English',
		file: 'en',
		locale: [ 'en', 'en-en' ]
	},
	{
		nativeName: 'Español',
		file: 'es',
		locale: [ 'es', 'es-es' ]
	},
	{
		nativeName: 'Français',
		file: 'fr',
		locale: [ 'fr', 'fr-fr' ]
	},
	{
		nativeName: 'Hrvatski',
		file: 'hr',
		locale: [ 'hr', 'hr-hr' ]
	},
	{
		nativeName: 'Italiano',
		file: 'it',
		locale: [ 'it', 'it-it' ]
	},
	{
		nativeName: 'Latviešu',
		file: 'lv',
		locale: [ 'lv', 'lv-lv' ]
	},
	{
		nativeName: 'Magyar',
		file: 'hu',
		locale: [ 'hu', 'hu-hu' ]
	},
	{
		nativeName: 'Norsk',
		file: 'nb',
		locale: [ 'nb', 'nb-no', 'no' ],
		tag: 'no'
	},
	{
		nativeName: 'Polski',
		file: 'pl',
		locale: [ 'pl', 'pl-pl' ]
	},
	{
		nativeName: 'Português',
		file: 'pt',
		locale: [ 'pt', 'pt-pt' ]
	},
	{
		nativeName: 'Română',
		file: 'ro',
		locale: [ 'ro', 'ro-ro' ]
	},
	{
		nativeName: 'Türkçe',
		file: 'tr',
		locale: [ 'tr', 'tr-tr' ]
	},
	{
		nativeName: 'Ελληνικά',
		file: 'el',
		locale: [ 'el', 'el-el' ]
	},
	{
		nativeName: 'Қазақ тілі',
		file: 'kk',
		locale: [ 'kk', 'kk-kz' ]
	},
	{
		nativeName: 'Русский',
		file: 'ru',
		locale: [ 'ru', 'ru-ru' ]
	},
	{
		nativeName: 'Українська',
		file: 'uk',
		locale: [ 'uk', 'uk-uk' ]
	},
	{
		nativeName: 'فارسی',
		file: 'fa',
		locale: [ 'fa', 'fa-ir' ],
		direction: 'rtl',
		invitations: false
	},
	{
		nativeName: 'हिन्दी',
		file: 'hi',
		locale: [ 'hi', 'hi-hi' ]
	},
	{
		nativeName: '简体中文',
		file: 'cn',
		locale: [ 'zh', 'zh-cn', 'zh-sg', 'zh-hans' ],
		tag: 'zh-Hans'
	},
	{
		nativeName: '繁體中文',
		file: 'tw',
		locale: [ 'zh-tw', 'zh-hk', 'zh-mo', 'zh-hant' ],
		tag: 'zh-Hant'
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

export const languageTag = ({ tag, locale }: ILocale): string => tag ?? locale[0];

const sameName = (a: string | undefined, b: string, locale: string): boolean =>
	a !== undefined && a.localeCompare(b, locale, { sensitivity: 'accent' }) === 0;

export const translatedLanguageName = (entry: ILocale, uiLocale: string): string | undefined => {
	const uiEntry = findLocale(uiLocale);
	let names: Intl.DisplayNames;

	try {
		names = new Intl.DisplayNames([ uiLocale ], { type: 'language', fallback: 'none' });
	} catch {
		return undefined;
	}

	// A browser without names in the UI language gives none, or English ones.
	if (!uiEntry || !sameName(names.of(languageTag(uiEntry)), uiEntry.nativeName, uiLocale)) return undefined;

	const translated = names.of(languageTag(entry));

	if (!translated || sameName(translated, entry.nativeName, uiLocale)) return undefined;

	return translated.charAt(0).toLocaleUpperCase(uiLocale) + translated.slice(1);
};

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
