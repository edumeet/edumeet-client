import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import { SignalingService } from '../services/signalingService';
import createMediasoupMiddleware from './middleware/mediasoupMiddleware';
import createSignalingMiddleware from './middleware/signalingMiddleware';
import createRoomMiddleware from './middleware/roomMiddleware';
import createFilesharingMiddleware from './middleware/filesharingMiddleware';
import roomSlice from './slices/roomSlice';
import meSlice from './slices/meSlice';
import consumersSlice from './slices/consumersSlice';
import signalingSlice from './slices/signalingSlice';
import webrtcSlice from './slices/webrtcSlice';
import permissionsSlice from './slices/permissionsSlice';
import createPermissionsMiddleware from './middleware/permissionsMiddleware';
import lobbySlice from './slices/lobbySlice';
import settingsSlice from './slices/settingsSlice';
import drawerSlice from './slices/drawerSlice';
import uiSlice from './slices/uiSlice';
import { EdumeetConfig } from '../utils/types';
import edumeetConfig from '../utils/edumeetConfig';

export interface MiddlewareOptions {
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

const reducer = combineReducers({
	signaling: signalingSlice.reducer,
	settings: settingsSlice.reducer,
	ui: uiSlice.reducer,
	webrtc: webrtcSlice.reducer,
	room: roomSlice.reducer,
	drawer: drawerSlice.reducer,
	lobby: lobbySlice.reducer,
	permissions: permissionsSlice.reducer,
	me: meSlice.reducer,
	consumers: consumersSlice.reducer,
});

const pReducer = persistReducer<any, any>(persistConfig, reducer);

export const store = configureStore({
	reducer: pReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			thunk: {
				extraArgument: {
					config: edumeetConfig,
					signalingService,
				}
			}
		}).concat(
			createSignalingMiddleware({ config: edumeetConfig, signalingService }),
			createMediasoupMiddleware({ config: edumeetConfig, signalingService }),
			createFilesharingMiddleware({ config: edumeetConfig, signalingService }),
			createPermissionsMiddleware({ config: edumeetConfig, signalingService }),
			createRoomMiddleware({ config: edumeetConfig, signalingService }),
			createLogger({
				duration: true,
				timestamp: false,
				level: 'log',
				logErrors: true,
			})
		)
});

export const persistor = persistStore(store);
export type RootDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;