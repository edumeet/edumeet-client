import { Logger } from 'edumeet-common';
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

	if (locale)
		newLocale = await loadLocale(locale);
	else {
		const oldLocale = getState().settings.locale;

		if (!oldLocale)
			return;
		
		// Workaround to trigger rerender with new locale
		dispatch(settingsActions.setLocale(''));
		newLocale = await loadLocale(oldLocale);
	}

	dispatch(settingsActions.setLocale(newLocale));
	dispatch(roomActions.updateRoom({ localeInProgress: false }));
};