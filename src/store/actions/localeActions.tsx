import { Logger } from '../../utils/Logger';
import { isRtlLocale, loadLocale } from '../../utils/intlManager';
import { loadRtlSupport } from '../../utils/rtl';
import { roomActions } from '../slices/roomSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppThunk } from '../store';

const logger = new Logger('LocaleActions');

/**
 * This thunk action loads sets a new locale.
 * 
 * @param locale - Locale to set.
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const setLocale = (locale?: string): AppThunk<Promise<void>> => async (
	dispatch,
	getState,
): Promise<void> => {
	logger.debug('setLocale() [message: "%s"]', locale);

	dispatch(roomActions.updateRoom({ localeInProgress: true }));

	let newLocale: string;

	if (locale) {
		newLocale = await loadLocale(locale);
	} else {
		// If persisted locale is empty or undefined, fall back to 'en'

		const storeLocale = getState().settings.locale;

		logger.debug('setLocale() [store locale: "%s"]', storeLocale);

		newLocale = await loadLocale(storeLocale || 'en');
	}

	logger.debug('setLocale() [setting locale to: "%s"]', newLocale);

	let rtl = isRtlLocale(newLocale);

	if (rtl) {
		try {
			await loadRtlSupport();
		} catch (error) {
			logger.error('setLocale() right-to-left support failed to load [error:%o]', error);
			rtl = false;
		}
	}

	document.documentElement.lang = newLocale;

	dispatch(settingsActions.setLocale(newLocale));
	dispatch(roomActions.updateRoom({ localeInProgress: false, rtl }));
};
