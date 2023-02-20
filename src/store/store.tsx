import {
	configureStore,
	combineReducers,
	ThunkAction,
	Action,
} from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import {
	persistStore,
	persistReducer,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import { MediaService } from '../services/mediaService';
import { SignalingService } from '../services/signalingService';
import createMediaMiddleware from './middlewares/mediaMiddleware';
import createSignalingMiddleware from './middlewares/signalingMiddleware';
import createRoomMiddleware from './middlewares/roomMiddleware';
import createFilesharingMiddleware from './middlewares/filesharingMiddleware';
import createPeerMiddleware from './middlewares/peerMiddleware';
import createPermissionsMiddleware from './middlewares/permissionsMiddleware';
import createRecordingMiddleware from './middlewares/recordingMiddleware';
import createChatMiddleware from './middlewares/chatMiddleware';
import createNotificationMiddleware from './middlewares/notificationMiddleware';
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
import filesharingSlice from './slices/filesharingSlice';
import notificationsSlice from './slices/notificationsSlice';
import uiSlice from './slices/uiSlice';
import { EdumeetConfig } from '../utils/types';
import edumeetConfig from '../utils/edumeetConfig';
import { createContext } from 'react';
import { DeviceService } from '../services/deviceService';
import { FileService } from '../services/fileService';
import recordingSlice from './slices/recordingSlice';
import { PerformanceMonitor } from '../utils/performanceMonitor';

export interface MiddlewareOptions {
	mediaService: MediaService;
	performanceMonitor: PerformanceMonitor;
	fileService: FileService;
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
const performanceMonitor = new PerformanceMonitor();

export const mediaService = new MediaService({ signalingService });
export const fileService = new FileService({ signalingService });

/**
 * The entire App is wrapped in this context, so that all
 * components can access the mediaService and the fileService.
 * 
 * @see VideoView.tsx for an example.
 */
export const ServiceContext = createContext<{
	mediaService: MediaService,
	fileService: FileService
}>({ mediaService, fileService });

const middlewareOptions = {
	config: edumeetConfig,
	mediaService,
	performanceMonitor,
	fileService,
	deviceService,
	signalingService,
};

const reducer = combineReducers({
	consumers: consumersSlice.reducer,
	drawer: drawerSlice.reducer,
	notifications: notificationsSlice.reducer,
	lobbyPeers: lobbyPeersSlice.reducer,
	chat: chatSlice.reducer,
	filesharing: filesharingSlice.reducer,
	me: meSlice.reducer,
	peers: peersSlice.reducer,
	permissions: permissionsSlice.reducer,
	producers: producersSlice.reducer,
	room: roomSlice.reducer,
	settings: settingsSlice.reducer,
	signaling: signalingSlice.reducer,
	ui: uiSlice.reducer,
	webrtc: webrtcSlice.reducer,
	recording: recordingSlice.reducer,
});

const pReducer = persistReducer<RootState>(persistConfig, reducer);

export const store = configureStore({
	reducer: pReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [ FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER ],
			},
			thunk: {
				extraArgument: middlewareOptions
			}
		}).concat(
			createSignalingMiddleware(middlewareOptions),
			createMediaMiddleware(middlewareOptions),
			createPeerMiddleware(middlewareOptions),
			createChatMiddleware(middlewareOptions),
			createFilesharingMiddleware(middlewareOptions),
			createPermissionsMiddleware(middlewareOptions),
			createRoomMiddleware(middlewareOptions),
			createNotificationMiddleware(middlewareOptions),
			createRecordingMiddleware(middlewareOptions),
			createLogger({
				duration: true,
				timestamp: false,
				level: 'log',
				logErrors: true,
			})
		)
});

export const persistor = persistStore(store);
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof reducer>;
export type AppThunk<ReturnType = void> = ThunkAction<
	ReturnType,
	RootState,
	MiddlewareOptions,
	Action<string>
>;

export const LeavePromptContext = createContext<() => Promise<void>>(() =>
	Promise.resolve()
);