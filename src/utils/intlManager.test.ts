import { describe, expect, it, vi } from 'vitest';
import { findLocale, invitationLocales, isRtlLocale, languageTag, localeList, translatedLanguageName } from './intlManager';

describe('findLocale', () => {
	it.each([
		[ 'zh-tw', 'tw' ],
		[ 'zh-hk', 'tw' ],
		[ 'zh-mo', 'tw' ],
		[ 'zh-cn', 'cn' ],
		[ 'zh-sg', 'cn' ],
		[ 'nb-no', 'nb' ],
		[ 'no', 'nb' ],
	])('finds %s by the exact tag (%s)', (locale, file) => {
		expect(findLocale(locale)?.file).toBe(file);
	});

	it.each([
		[ 'zh-Hant-TW', 'tw' ],
		[ 'zh-Hant-HK', 'tw' ],
		[ 'zh-Hans-CN', 'cn' ],
		[ 'zh-Hans', 'cn' ],
	])('uses the script or region of %s (%s)', (locale, file) => {
		expect(findLocale(locale)?.file).toBe(file);
	});

	it.each([
		[ 'cs-cz', 'cs' ],
		[ 'el-gr', 'el' ],
		[ 'uk-ua', 'uk' ],
		[ 'hi-in', 'hi' ],
		[ 'pt-br', 'pt' ],
		[ 'es-mx', 'es' ],
		[ 'en-us', 'en' ],
		[ 'en_US', 'en' ],
		[ 'de-AT', 'de' ],
		[ 'fa-af', 'fa' ],
	])('falls back to the language of %s (%s)', (locale, file) => {
		expect(findLocale(locale)?.file).toBe(file);
	});

	it.each([ 'xx', 'xx-yy', 'sr-latn-rs', '' ])('finds nothing for "%s"', (locale) => {
		expect(findLocale(locale)).toBeUndefined();
	});

	it('finds every entry by its own first code', () => {
		for (const entry of localeList) expect(findLocale(entry.locale[0])).toBe(entry);
	});
});

describe('isRtlLocale', () => {
	it.each([ 'fa', 'fa-ir', 'fa-IR', 'fa-af' ])('%s is right to left', (locale) => {
		expect(isRtlLocale(locale)).toBe(true);
	});

	it.each([ 'en', 'de', 'pl', 'zh-tw', 'xx', '', undefined ])('%s is left to right', (locale) => {
		expect(isRtlLocale(locale)).toBe(false);
	});
});

describe('localeList', () => {
	// The first code becomes the page language and the locale for dates and numbers.
	const languageNames = new Intl.DisplayNames([ 'en' ], { type: 'language', fallback: 'none' });

	it.each(localeList.map(({ nativeName, locale }) => [ nativeName, locale[0] ]))('%s uses a real language code (%s)', (_name, code) => {
		expect(languageNames.of(code)).toBeDefined();
	});

	it.each(localeList.map((entry) => [ entry.nativeName, entry ] as const))('%s is the name of the language in itself', (_name, entry) => {
		expect(translatedLanguageName(entry, languageTag(entry))).toBeUndefined();
	});

	it('is sorted by the native name', () => {
		const names = localeList.map(({ nativeName }) => nativeName);

		expect(names).toEqual([ ...names ].sort(new Intl.Collator('en').compare));
	});
});

describe('translatedLanguageName', () => {
	it.each([
		[ 'de', 'en', 'German' ],
		[ 'cn', 'en', 'Simplified Chinese' ],
		[ 'tw', 'en', 'Traditional Chinese' ],
		[ 'en', 'de', 'Englisch' ],
	])('names %s in %s (%s)', (file, uiLocale, name) => {
		expect(translatedLanguageName(localeList.find((entry) => entry.file === file)!, uiLocale)).toBe(name);
	});

	it('starts the name with a capital letter in a menu', () => {
		expect(translatedLanguageName(findLocale('de')!, 'pl')).toBe('Niemiecki');
	});

	it('gives nothing when the name is the same as the native name', () => {
		expect(translatedLanguageName(findLocale('pl')!, 'pl')).toBeUndefined();
	});

	it('gives nothing when the browser has no names in the UI language', () => {
		const of = vi.spyOn(Intl.DisplayNames.prototype, 'of').mockReturnValue(undefined);

		expect(translatedLanguageName(findLocale('de')!, 'kk')).toBeUndefined();
		of.mockRestore();
	});

	it('gives nothing when the browser falls back to English names', () => {
		const english = new Intl.DisplayNames([ 'en' ], { type: 'language' });
		const original = Intl.DisplayNames.prototype.of;
		const of = vi.spyOn(Intl.DisplayNames.prototype, 'of').mockImplementation((code) => original.call(english, code));

		expect(translatedLanguageName(findLocale('de')!, 'kk')).toBeUndefined();
		of.mockRestore();
	});
});

describe('invitationLocales', () => {
	it('leaves out languages without an invitation template', () => {
		expect(invitationLocales.map(({ file }) => file)).not.toContain('fa');
	});

	it('keeps every other language', () => {
		expect(invitationLocales).toHaveLength(localeList.length - 1);
		expect(invitationLocales.map(({ file }) => file)).toContain('en');
	});
});
