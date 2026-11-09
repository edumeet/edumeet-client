import { describe, expect, it } from 'vitest';
import { findLocale, invitationLocales, isRtlLocale, localeList } from './intlManager';

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

	it.each(localeList.map(({ name, locale }) => [ name, locale[0] ]))('%s uses a real language code (%s)', (_name, code) => {
		expect(languageNames.of(code)).toBeDefined();
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
