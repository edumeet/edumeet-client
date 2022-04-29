import { loadLocale } from '../../utils/intlManager';
import { Logger } from '../../utils/logger';

const logger = new Logger('LocaleActions');

export const setLocale = (locale: string) => async (): Promise<void> => {
	logger.debug('setLocale() [message:"%s"]', locale);

	await loadLocale(locale);
};