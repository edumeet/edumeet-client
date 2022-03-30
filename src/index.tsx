import React from 'react';
import ReactDOM from 'react-dom';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import './index.css';
import debug from 'debug';
import App from './App';
import { persistor, store, mediaService, MediaServiceContext } from './store/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import * as serviceWorker from './serviceWorker';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { detectDevice } from 'mediasoup-client';
import { supportedBrowsers, deviceInfo, browserInfo } from './utils/deviceInfo';
import { Logger } from './utils/logger';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import UnsupportedBrowser from './views/unsupported/UnsupportedBrowser';
import LandingPage from './views/landingpage/LandingPage';

if (process.env.REACT_APP_DEBUG === '*' || process.env.NODE_ENV !== 'production') {
	debug.enable('* -engine* -socket* -RIE* *WARN* *ERROR*');
}

const logger = new Logger('index.tsx');
const theme = createTheme();
const device = deviceInfo();
const unsupportedBrowser = 
	!detectDevice() ||
	!browserInfo.satisfies(supportedBrowsers);
const webrtcUnavailable =
	!navigator.mediaDevices ||
	!navigator.mediaDevices.getUserMedia ||
	!window.RTCPeerConnection;

const RootComponent = () => {
	if (unsupportedBrowser || webrtcUnavailable) {
		logger.error('Your browser is not supported [deviceInfo:%o]', device);

		return (<UnsupportedBrowser platform={device.platform} webrtcUnavailable />);
	} else {
		return (
			<SnackbarProvider>
				<BrowserRouter>
					<Routes>
						<Route path='/' element={<LandingPage />} />
						<Route path='/:id' element={<App />} />
					</Routes>
				</BrowserRouter>
			</SnackbarProvider>
		);
	}
};

ReactDOM.render(
	<React.StrictMode>
		<CssBaseline />
		<Provider store={store}>
			<PersistGate persistor={persistor}>
				<ThemeProvider theme={theme}>
					<IntlProvider locale='en' defaultLocale='en'>
						<MediaServiceContext.Provider value={mediaService}>
							<RootComponent />
						</MediaServiceContext.Provider>
					</IntlProvider>
				</ThemeProvider>
			</PersistGate>
		</Provider>
	</React.StrictMode>,
	document.getElementById('edumeet'),
);

serviceWorker.unregister();