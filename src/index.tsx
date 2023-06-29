import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import { RawIntlProvider } from 'react-intl';
import './index.css';
import debug from 'debug';
import App from './App';
import {
	persistor,
	store,
	mediaService,
	fileService,
	ServiceContext
} from './store/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
// import * as serviceWorker from './serviceWorker';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { detectDevice } from 'mediasoup-client';
import { supportedBrowsers, deviceInfo, browserInfo } from './utils/deviceInfo';
import CssBaseline from '@mui/material/CssBaseline';
import UnsupportedBrowser from './views/unsupported/UnsupportedBrowser';
import LandingPage from './views/landingpage/LandingPage';
import edumeetConfig from './utils/edumeetConfig';
import { intl } from './utils/intlManager';
import { useAppDispatch } from './store/hooks';
import { setLocale } from './store/actions/localeActions';
import { Logger } from 'edumeet-common';

import ErrorBoundary from './views/errorboundary/ErrorBoundary';

if (import.meta.env.VITE_APP_DEBUG === '*' || import.meta.env.NODE_ENV !== 'production') {
	debug.enable('* -engine* -socket* -RIE* *WARN* *ERROR*');
}

const logger = new Logger('index.tsx');
const theme = createTheme(edumeetConfig.theme);
const device = deviceInfo();
const unsupportedBrowser = 
	!detectDevice() ||
	!browserInfo.satisfies(supportedBrowsers);
const webrtcUnavailable =
	!navigator.mediaDevices ||
	!navigator.mediaDevices.getUserMedia ||
	!window.RTCPeerConnection;

const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route path='/' element={<LandingPage />} errorElement={<ErrorBoundary />} />
			<Route path='/:id' element={<App />} errorElement={<ErrorBoundary />} />
		</>
	)
);

/**
 * Return either the app or the unsupported browser page
 * based on feature detection.
 * 
 * @returns {JSX.Element} Either the app or the unsupported browser page
 */
const RootComponent = (): JSX.Element => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(setLocale());
	}, []);

	if (unsupportedBrowser || webrtcUnavailable) {
		logger.error('Your browser is not supported [deviceInfo:%o]', device);

		return (<UnsupportedBrowser platform={device.platform} webrtcUnavailable />);
	} else {
		return (<RouterProvider router={router} />);
	}
};

const container = document.getElementById('edumeet');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);

root.render(
	<React.StrictMode>
		<CssBaseline />
		<Provider store={store}>
			<PersistGate persistor={persistor}>
				<ThemeProvider theme={theme}>
					<RawIntlProvider value={intl}>
						<ServiceContext.Provider value={{ mediaService, fileService }}>
							<RootComponent />
						</ServiceContext.Provider>
					</RawIntlProvider>
				</ThemeProvider>
			</PersistGate>
		</Provider>
	</React.StrictMode>
);

// serviceWorker.unregister();