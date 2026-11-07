import { describe, expect, it } from 'vitest';
import { getDirection } from './direction';

describe('getDirection', () => {
	it.each([ 'fa', 'fa-IR', 'fa_ir' ])('%s is RTL', (locale) => {
		expect(getDirection(locale)).toBe('rtl');
	});

	it.each([ 'en', 'en-US', 'de-DE', 'zh-CN', undefined ])('%s is LTR', (locale) => {
		expect(getDirection(locale)).toBe('ltr');
	});
});
