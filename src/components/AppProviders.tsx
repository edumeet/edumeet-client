import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { useEffect, useMemo, type ReactNode } from 'react';
import { RawIntlProvider } from 'react-intl';
import { useAppSelector } from '../store/hooks';
import edumeetConfig from '../utils/edumeetConfig';
import { getDirection } from '../utils/direction';
import { intl } from '../utils/intlManager';

interface AppProvidersProps {
	children: ReactNode;
}

/** Owns the single app theme and Emotion cache so direction changes are atomic. */
const AppProviders = ({ children }: AppProvidersProps): React.JSX.Element => {
	const locale = useAppSelector((state) => state.settings.locale);
	const direction = getDirection(locale);
	const theme = useMemo(() => createTheme({
		...edumeetConfig.theme,
		direction,
		typography: {
			...edumeetConfig.theme.typography,
			...(direction === 'rtl' && {
				fontFamily: "'Vazirmatn RD', 'Roboto', sans-serif",
			}),
		},
	}), [ direction ]);
	const cache = useMemo(() => createCache({
		key: `edumeet-${direction}`,
		stylisPlugins: direction === 'rtl' ? [ rtlPlugin ] : [],
	}), [ direction ]);

	useEffect(() => {
		document.documentElement.dir = direction;
		document.documentElement.lang = locale || 'en';
	}, [ direction, locale ]);

	return (
		<CacheProvider key={direction} value={cache}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<RawIntlProvider value={intl}>{children}</RawIntlProvider>
			</ThemeProvider>
		</CacheProvider>
	);
};

export default AppProviders;
