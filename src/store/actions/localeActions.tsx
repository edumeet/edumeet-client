import { Logger } from '../../utils/Logger';
import { loadLocale } from '../../utils/intlManager';
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
	logger.debug('setLocale() [message:"%s"]', locale);

	dispatch(roomActions.updateRoom({ localeInProgress: true }));

	let newLocale: string;

	if (locale) {
		newLocale = await loadLocale(locale);
	} else {
		const storedLocale = getState().settings.locale;

		// If stored locale is empty or undefined, fall back to English
		const fallbackLocale =
			storedLocale && storedLocale.trim() !== '' ? storedLocale : 'en';

		newLocale = await loadLocale(fallbackLocale);
	}

	dispatch(settingsActions.setLocale(newLocale));
	dispatch(roomActions.updateRoom({ localeInProgress: false }));
};
