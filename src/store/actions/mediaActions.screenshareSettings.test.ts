import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, screenSharingResolution: 'veryhigh', screenSharingFrameRate: 5 } }));
vi.mock('../store', () => ({}));
vi.mock('../../services/clientImageService', () => ({}));

import { configureStore } from '@reduxjs/toolkit';
import meSlice, { meActions } from '../slices/meSlice';
import settingsSlice from '../slices/settingsSlice';
import permissionsSlice, { permissionsActions } from '../slices/permissionsSlice';
import { permissions } from '../../utils/roles';
import { updateScreenSharing, updateScreenshareSettings } from './mediaActions';

const setup = (sharing: boolean) => {
	const screenTrack = { applyConstraints: vi.fn(async () => undefined) };
	const mediaService = {
		mediaSenders: {
			screen: { running: sharing, track: sharing ? screenTrack : null, start: vi.fn() },
			screenaudio: { running: false, track: null, start: vi.fn() },
		},
	};
	const store = configureStore({
		reducer: { me: meSlice.reducer, settings: settingsSlice.reducer, permissions: permissionsSlice.reducer },
		middleware: (getDefaultMiddleware) => getDefaultMiddleware({
			thunk: { extraArgument: { mediaService, config: {} } },
			serializableCheck: false,
			immutableCheck: false,
		}),
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const dispatch = (thunk: unknown) => store.dispatch(thunk as any) as Promise<void>;

	store.dispatch(permissionsActions.setPermissions([ permissions.SHARE_SCREEN ]));
	store.dispatch(meActions.setScreenEnabled(sharing));

	return { mediaService, screenTrack, store, dispatch };
};

describe('changing the screen sharing frame rate', () => {
	it('keeps a running screen share shown as on and applies the new frame rate to it', async () => {
		const { mediaService, screenTrack, store, dispatch } = setup(true);

		await dispatch(updateScreenshareSettings({ screenSharingFrameRate: 30 }));

		expect(store.getState().me.screenEnabled).toBe(true);
		expect(store.getState().me.screenSharingInProgress).toBe(false);
		expect(store.getState().settings.screenSharingFrameRate).toBe(30);
		expect(screenTrack.applyConstraints).toHaveBeenCalledWith(expect.objectContaining({ frameRate: 30 }));
		expect(mediaService.mediaSenders.screen.start).not.toHaveBeenCalled();
	});

	it('only stores the frame rate when nothing is shared', async () => {
		const { mediaService, store, dispatch } = setup(false);

		await dispatch(updateScreenshareSettings({ screenSharingFrameRate: 30 }));

		expect(store.getState().me.screenEnabled).toBe(false);
		expect(store.getState().settings.screenSharingFrameRate).toBe(30);
		expect(mediaService.mediaSenders.screen.start).not.toHaveBeenCalled();
	});
});

describe('a screen share that is stopped while it starts', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('is not shown as on, and its capture is released', async () => {
		const { mediaService, store, dispatch } = setup(false);
		const video = { kind: 'video', stop: vi.fn(), getSettings: () => ({ width: 1920, height: 1080 }) };
		const audio = { kind: 'audio', stop: vi.fn() };
		const stream = { getVideoTracks: () => [ video ], getAudioTracks: () => [ audio ], getTracks: () => [ video, audio ] };

		vi.stubGlobal('navigator', { mediaDevices: { getDisplayMedia: vi.fn(async () => stream) } });
		await dispatch(updateScreenSharing());

		expect(mediaService.mediaSenders.screen.start).toHaveBeenCalled();
		expect(store.getState().me.screenEnabled).toBe(false);
		expect(video.stop).toHaveBeenCalled();
		expect(audio.stop).toHaveBeenCalled();
		expect(mediaService.mediaSenders.screenaudio.start).not.toHaveBeenCalled();
	});
});
