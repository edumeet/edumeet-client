import { Box, Typography } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import { findLocale, ILocale, languageTag, translatedLanguageName } from '../../utils/intlManager';

interface LanguageNameProps {
	language: ILocale;
}

const LanguageName = ({ language }: LanguageNameProps): React.JSX.Element => {
	const locale = useAppSelector((state) => state.settings.locale);
	const uiLocale = (locale && findLocale(locale)?.locale[0]) || 'en';
	const translated = translatedLanguageName(language, uiLocale);

	return (
		<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, width: '100%', minWidth: 0 }}>
			<Box component='span' lang={languageTag(language)} dir={language.direction ?? 'ltr'} sx={{ flexShrink: 0 }}>
				{ language.nativeName }
			</Box>
			{ translated && (
				<Typography component='span' variant='body2' color='text.secondary' noWrap sx={{ marginInlineStart: 'auto', minWidth: 0 }}>
					{ translated }
				</Typography>
			)}
		</Box>
	);
};

export default LanguageName;
