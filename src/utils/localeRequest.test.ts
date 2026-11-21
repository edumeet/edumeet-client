import { describe, expect, it, vi } from 'vitest';

vi.mock('../store/actions/localeActions', () => ({
	setLocale: (locale?: string) => ({ type: 'test/setLocale', locale })
}));

import { SET_LOCALE_EVENT, listenForLocaleRequests, requestedLocale } from './localeRequest';

const request = (detail: unknown) => new CustomEvent(SET_LOCALE_EVENT, { detail });
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

// A dispatch whose loads finish only when the test says so.
const controlledDispatch = () => {
	const finish: Array<() => void> = [];
	const dispatch = vi.fn(() => new Promise<void>((resolve) => finish.push(resolve)));

	return { dispatch, finish };
};

const locales = (dispatch: ReturnType<typeof vi.fn>) => dispatch.mock.calls.map(([ action ]) => (action as { locale: string }).locale);

describe('language requested by automation', () => {
	it('is asked for with the event the SIP gateway sends', () => {
		expect(SET_LOCALE_EVENT).toBe('edumeet:set-locale');
	});

	it.each([
		[ { locale: 'pl' }, 'pl' ],
		[ { locale: ' PL-pl ' }, 'pl' ],
		[ { locale: 'da' }, 'da' ],
		[ { locale: 'nb-NO' }, 'nb' ],
		[ { locale: 'uk-UA' }, 'uk' ],
	])('takes a language the page has (%o)', (detail, locale) => {
		expect(requestedLocale(request(detail))).toBe(locale);
	});

	it.each([
		[ { locale: 'xx' } ],
		[ { locale: '' } ],
		[ { locale: 12 } ],
		[ { lang: 'pl' } ],
		[ 'pl' ],
		[ null ],
		[ undefined ],
	])('ignores anything else rather than switching to English (%o)', (detail) => {
		expect(requestedLocale(request(detail))).toBeUndefined();
	});

	it('switches the language as the chooser does, and only for a known one', async () => {
		const target = new EventTarget();
		const dispatch = vi.fn(async () => undefined);

		listenForLocaleRequests(dispatch as never, { target });
		target.dispatchEvent(request({ locale: 'pl' }));
		await settle();
		target.dispatchEvent(request({ locale: 'xx' }));
		await settle();

		expect(dispatch).toHaveBeenCalledTimes(1);
		expect(dispatch).toHaveBeenCalledWith({ type: 'test/setLocale', locale: 'pl' });
	});

	it('loads one language at a time, and the one asked for last wins', async () => {
		const target = new EventTarget();
		const { dispatch, finish } = controlledDispatch();

		listenForLocaleRequests(dispatch as never, { target });
		target.dispatchEvent(request({ locale: 'pl' }));
		await settle();
		target.dispatchEvent(request({ locale: 'de' }));
		target.dispatchEvent(request({ locale: 'uk' }));
		await settle();
		expect(locales(dispatch)).toEqual([ 'pl' ]);

		finish[0]();
		await settle();
		expect(locales(dispatch)).toEqual([ 'pl', 'uk' ]);

		finish[1]();
		await settle();
		target.dispatchEvent(request({ locale: 'fr' }));
		await settle();
		expect(locales(dispatch)).toEqual([ 'pl', 'uk', 'fr' ]);
	});

	it('waits for the first language of the page before switching', async () => {
		const target = new EventTarget();
		const dispatch = vi.fn(async () => undefined);
		let pageLoaded: () => void = () => undefined;
		const ready = new Promise<void>((resolve) => { pageLoaded = resolve; });

		listenForLocaleRequests(dispatch as never, { target, ready });
		target.dispatchEvent(request({ locale: 'pl' }));
		await settle();
		expect(dispatch).not.toHaveBeenCalled();

		pageLoaded();
		await settle();
		expect(locales(dispatch)).toEqual([ 'pl' ]);
	});

	it('still applies a language asked for while a failing load was running', async () => {
		const target = new EventTarget();
		// eslint-disable-next-line no-unused-vars
		let fail: (error: Error) => void = () => undefined;
		const dispatch = vi.fn()
			.mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }))
			.mockResolvedValue(undefined);

		listenForLocaleRequests(dispatch as never, { target });
		target.dispatchEvent(request({ locale: 'pl' }));
		await settle();
		target.dispatchEvent(request({ locale: 'de' }));
		fail(new Error('chunk failed'));
		await settle();

		expect(locales(dispatch)).toEqual([ 'pl', 'de' ]);
	});

	it('still switches when the first language of the page failed to load', async () => {
		const target = new EventTarget();
		const dispatch = vi.fn(async () => undefined);
		const ready = Promise.reject(new Error('first load failed'));

		listenForLocaleRequests(dispatch as never, { target, ready });
		target.dispatchEvent(request({ locale: 'pl' }));
		await settle();
		target.dispatchEvent(request({ locale: 'de' }));
		await settle();

		expect(locales(dispatch)).toEqual([ 'pl', 'de' ]);
	});

	it('keeps answering after a load that failed', async () => {
		const target = new EventTarget();
		const dispatch = vi.fn().mockRejectedValueOnce(new Error('chunk failed'))
			.mockResolvedValue(undefined);

		listenForLocaleRequests(dispatch as never, { target });
		target.dispatchEvent(request({ locale: 'pl' }));
		await settle();
		target.dispatchEvent(request({ locale: 'de' }));
		await settle();

		expect(locales(dispatch)).toEqual([ 'pl', 'de' ]);
	});

	it('stops listening when it is removed', async () => {
		const target = new EventTarget();
		const dispatch = vi.fn(async () => undefined);
		const stop = listenForLocaleRequests(dispatch as never, { target });

		stop();
		target.dispatchEvent(request({ locale: 'pl' }));
		await settle();

		expect(dispatch).not.toHaveBeenCalled();
	});

	it('does not answer other events', async () => {
		const target = new EventTarget();
		const dispatch = vi.fn(async () => undefined);

		listenForLocaleRequests(dispatch as never, { target });
		target.dispatchEvent(new CustomEvent('edumeet:other', { detail: { locale: 'pl' } }));
		await settle();

		expect(dispatch).not.toHaveBeenCalled();
	});
});
