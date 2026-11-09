import React, { useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import { RawIntlProvider } from 'react-intl';
import './index.css';
import debug from 'debug';
import { persistor, store, mediaService, fileService, ServiceContext } from './store/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider, createTheme, type Theme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { supportedBrowsers, deviceInfo, browserInfo } from './utils/deviceInfo';
import edumeetConfig from './utils/edumeetConfig';
import { intl } from './utils/intlManager';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { rtlCache } from './utils/rtl';
import { setLocale } from './store/actions/localeActions';
import { CssBaseline } from '@mui/material';
import { Logger } from './utils/Logger';
import { SnackbarProvider } from 'notistack';
import Management from './views/management/Management';

const ErrorBoundary = lazy(() => import('./views/errorboundary/ErrorBoundary'));
const App = lazy(() => import('./App'));
const LandingPage = lazy(() => import('./views/landingpage/LandingPage'));
const UnsupportedBrowser = lazy(() => import('./views/unsupported/UnsupportedBrowser'));

if (import.meta.env.VITE_APP_DEBUG === '*' || !import.meta.env.PROD) {
	debug.enable('* -engine* -socket* -RIE* *WARN* *ERROR*');
}

const logger = new Logger('index.tsx');
const theme = createTheme(edumeetConfig.theme);
// Same settings as emotion's built-in cache, so left to right renders as before.
const ltrCache = createCache({ key: 'css' });
let rtlTheme: Theme | undefined;

const getRtlTheme = (): Theme => {
	if (!rtlTheme) rtlTheme = createTheme({ ...edumeetConfig.theme, direction: 'rtl' });

	return rtlTheme;
};

// The tree keeps its shape when the direction changes: replacing it would
// remount App, whose cleanup sends a user in a meeting back to the join page.
const ThemedRoot = ({ children }: React.PropsWithChildren): React.JSX.Element => {
	const rtl = useAppSelector((state) => state.room.rtl);
	const cache = (rtl && rtlCache()) || ltrCache;
	const isRtl = cache !== ltrCache;

	useLayoutEffect(() => {
		if (isRtl) document.documentElement.setAttribute('dir', 'rtl');
		else document.documentElement.removeAttribute('dir');
	}, [ isRtl ]);

	return (
		<CacheProvider value={cache}>
			<ThemeProvider theme={isRtl ? getRtlTheme() : theme}>{children}</ThemeProvider>
		</CacheProvider>
	);
};

const device = deviceInfo();
const unsupportedBrowser = !browserInfo.satisfies(supportedBrowsers);
const webrtcUnavailable = !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.RTCPeerConnection;

// Detect the base url we are hosted on
const basename = window.location.pathname.split('/')
	.slice(0, -1)
	.join('/');

logger.debug('Starting app [baseUrl:%s]', basename);

// Set the page title dynamically from config
document.title = edumeetConfig.title || 'edumeet';

const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route path='/' element={<Suspense><LandingPage /></Suspense>} errorElement={<Suspense><ErrorBoundary /></Suspense>} />
			<Route path='/mgmt-admin' element={<Suspense>
				<SnackbarProvider>
					<Management />
				</SnackbarProvider>
			</Suspense>} errorElement={<Suspense><ErrorBoundary /></Suspense>} />
			
			<Route path='/:id' element={<Suspense><App /></Suspense>} errorElement={<Suspense><ErrorBoundary /></Suspense>} />
		</>
	), { basename }
);

/**
 * Return either the app or the unsupported browser page
 * based on feature detection.
 * 
 * @returns {JSX.Element} Either the app or the unsupported browser page
 */
const RootComponent = (): React.JSX.Element => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(setLocale());
	}, [ dispatch ]);

	if (unsupportedBrowser || webrtcUnavailable) {
		logger.error('Your browser is not supported [deviceInfo:%o]', device);

		return (<Suspense><UnsupportedBrowser platform={device.platform} webrtcUnavailable /></Suspense>);
	} else {
		return (<RouterProvider router={router} />);
	}
};

const container = document.getElementById('edumeet');
 
const root = createRoot(container!);

root.render(
	<>
		<CssBaseline />
		<Provider store={store}>
			<PersistGate persistor={persistor}>
				<ThemedRoot>
					<RawIntlProvider value={intl}>
						<ServiceContext.Provider value={{ mediaService, fileService }}>
							<RootComponent />
						</ServiceContext.Provider>
					</RawIntlProvider>
				</ThemedRoot>
			</PersistGate>
		</Provider>
	</>
);
