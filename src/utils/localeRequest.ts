import { setLocale } from '../store/actions/localeActions';
import type { AppDispatch } from '../store/store';
import { Logger } from './Logger';
import { findLocale } from './intlManager';

const logger = new Logger('LocaleRequest');

export const SET_LOCALE_EVENT = 'edumeet:set-locale';

// A language without a translation is ignored: loadLocale would turn it into English.
export const requestedLocale = (event: Event): string | undefined => {
	const locale = (event as CustomEvent<{ locale?: unknown } | undefined>).detail?.locale;

	if (typeof locale !== 'string') return undefined;

	return findLocale(locale.trim())?.locale[0];
};

interface LocaleRequestOptions {
	target?: EventTarget;
	ready?: Promise<unknown>;
}

// Languages load one at a time, after the page's own first one, and the language asked for last
// wins: two loads at once would finish in any order.
export const listenForLocaleRequests = (dispatch: AppDispatch, { target = document, ready = Promise.resolve() }: LocaleRequestOptions = {}): () => void => {
	let wanted: string | undefined;
	let running = false;

	const apply = async (): Promise<void> => {
		running = true;
		await ready.catch(() => undefined);
		while (wanted) {
			const locale = wanted;

			wanted = undefined;
			try {
				await dispatch(setLocale(locale));
			} catch (error) {
				logger.error('listenForLocaleRequests() [locale: %s, error:%o]', locale, error);
			}
		}
		running = false;
	};

	const handler = (event: Event): void => {
		const locale = requestedLocale(event);

		if (!locale) return;
		wanted = locale;
		if (!running) apply();
	};

	target.addEventListener(SET_LOCALE_EVENT, handler);

	return () => target.removeEventListener(SET_LOCALE_EVENT, handler);
};
