import {
	configureStore,
	combineReducers,
	ThunkDispatch,
	AnyAction
} from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import { MediaService } from '../services/mediaService';
import { SignalingService } from '../services/signalingService';
import createMediaMiddleware from './middlewares/mediaMiddleware';
import createSignalingMiddleware from './middlewares/signalingMiddleware';
import createRoomMiddleware from './middlewares/roomMiddleware';
import createFilesharingMiddleware from './middlewares/filesharingMiddleware';
import createLobbyMiddleware from './middlewares/lobbyMiddleware';
import createPeerMiddleware from './middlewares/peerMiddleware';
import createPermissionsMiddleware from './middlewares/permissionsMiddleware';
import roomSlice from './slices/roomSlice';
import meSlice from './slices/meSlice';
import consumersSlice from './slices/consumersSlice';
import signalingSlice from './slices/signalingSlice';
import webrtcSlice from './slices/webrtcSlice';
import permissionsSlice from './slices/permissionsSlice';
import lobbyPeersSlice from './slices/lobbyPeersSlice';
import settingsSlice from './slices/settingsSlice';
import drawerSlice from './slices/drawerSlice';
import peersSlice from './slices/peersSlice';
import producersSlice from './slices/producersSlice';
import chatSlice from './slices/chatSlice';
import uiSlice from './slices/uiSlice';
import { EdumeetConfig } from '../utils/types';
import edumeetConfig from '../utils/edumeetConfig';
import { createContext } from 'react';
import { DeviceService } from '../services/deviceService';

export interface MiddlewareOptions {
	mediaService: MediaService;
	deviceService: DeviceService;
	signalingService: SignalingService;
	config: EdumeetConfig;
}

const persistConfig = {
	key: 'root',
	storage,
	stateReconciler: autoMergeLevel2,
	whitelist: [ 'settings', 'intl', 'config' ],
};

const signalingService = new SignalingService();
const deviceService = new DeviceService();

export const mediaService = new MediaService({ signalingService });
export const MediaServiceContext = createContext<MediaService>(mediaService);

const middlewareOptions = {
	config: edumeetConfig,
	mediaService,
	deviceService,
	signalingService,
};

const reducer = combineReducers({
	consumers: consumersSlice.reducer,
	drawer: drawerSlice.reducer,
	lobbyPeers: lobbyPeersSlice.reducer,
	chat: chatSlice.reducer,
	me: meSlice.reducer,
	peers: peersSlice.reducer,
	permissions: permissionsSlice.reducer,
	producers: producersSlice.reducer,
	room: roomSlice.reducer,
	settings: settingsSlice.reducer,
	signaling: signalingSlice.reducer,
	ui: uiSlice.reducer,
	webrtc: webrtcSlice.reducer,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pReducer = persistReducer<any, any>(persistConfig, reducer);

export const store = configureStore({
	reducer: pReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			thunk: {
				extraArgument: middlewareOptions
			}
		}).concat(
			createSignalingMiddleware(middlewareOptions),
			createMediaMiddleware(middlewareOptions),
			createPeerMiddleware(middlewareOptions),
			createLobbyMiddleware(middlewareOptions),
			createFilesharingMiddleware(),
			createPermissionsMiddleware(middlewareOptions),
			createRoomMiddleware(middlewareOptions),
			createLogger({
				duration: true,
				timestamp: false,
				level: 'log',
				logErrors: true,
			})
		)
});

export const persistor = persistStore(store);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppDispatch = ThunkDispatch<RootState, any, AnyAction>;
export type RootState = ReturnType<typeof store.getState>;