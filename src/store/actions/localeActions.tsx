import { loadLocale } from '../../utils/intlManager';
import { Logger } from '../../utils/logger';
import { roomActions } from '../slices/roomSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppDispatch, RootState } from '../store';

const logger = new Logger('LocaleActions');

export const setLocale = (locale?: string) => async (
	dispatch: AppDispatch,
	getState: RootState,
): Promise<void> => {
	logger.debug('setLocale() [message:"%s"]', locale);

	dispatch(roomActions.updateRoom({ localeInProgress: true }));

	let newLocale: string;

	if (locale)
		newLocale = await loadLocale(locale);
	else {
		const oldLocale = getState().settings.locale;
		
		// Workaround to trigger rerender with new locale
		dispatch(settingsActions.setLocale(''));
		newLocale = await loadLocale(oldLocale);
	}

	dispatch(settingsActions.setLocale(newLocale));
	dispatch(roomActions.updateRoom({ localeInProgress: false }));
};