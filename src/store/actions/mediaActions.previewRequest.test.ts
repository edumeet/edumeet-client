import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, askForMediaOnJoin: true, browserWarnings: [], resolution: 'medium', aspectRatio: 1.778, frameRate: 30 } }));
vi.mock('../store', () => ({}));
vi.mock('../../services/clientImageService', () => ({}));

import { configureStore } from '@reduxjs/toolkit';
import meSlice from '../slices/meSlice';
import settingsSlice from '../slices/settingsSlice';
import { stopPreviewMic, stopPreviewWebcam, updatePreviewMic, updatePreviewWebcam } from './mediaActions';

type FakeTrack = { id: string; stop: ReturnType<typeof vi.fn>; getSettings: () => Record<string, unknown> };

const fakeTrack = (id: string): FakeTrack => ({ id, stop: vi.fn(), getSettings: () => ({ deviceId: 'device' }) });

const deferredStream = () => {
	let resolve = (): void => undefined;
	const track = fakeTrack(`track-${Math.random()}`);
	const stream = new Promise((done) => {
		resolve = () => done({ getAudioTracks: () => [ track ], getVideoTracks: () => [ track ] });
	});

	return { track, stream, resolve };
};

const setup = () => {
	const mediaService = {
		previewMicTrack: null as FakeTrack | null,
		previewWebcamTrack: null as FakeTrack | null,
		previewMicRequest: 0,
		previewWebcamRequest: 0,
	};
	const deviceService = { updateMediaDevices: vi.fn(async () => undefined), getDeviceId: () => 'device' };
	const effectsService = { stop: vi.fn(), applyEffect: vi.fn() };
	const store = configureStore({
		reducer: { me: meSlice.reducer, settings: settingsSlice.reducer },
		middleware: (getDefaultMiddleware) => getDefaultMiddleware({
			thunk: { extraArgument: { mediaService, deviceService, effectsService } },
			serializableCheck: false,
			immutableCheck: false,
		}),
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const dispatch = (thunk: unknown) => store.dispatch(thunk as any) as Promise<void>;

	return { mediaService, effectsService, store, dispatch };
};

describe('a preview camera or microphone that arrives after it is no longer wanted', () => {
	const getUserMedia = vi.fn();

	beforeEach(() => {
		vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
	});
	afterEach(() => {
		vi.unstubAllGlobals();
		getUserMedia.mockReset();
	});

	it('becomes the preview microphone when nothing stopped it', async () => {
		const { mediaService, store, dispatch } = setup();
		const pending = deferredStream();

		getUserMedia.mockReturnValueOnce(pending.stream);

		const started = dispatch(updatePreviewMic());

		pending.resolve();
		await started;

		expect(mediaService.previewMicTrack).toBe(pending.track);
		expect(store.getState().me.previewMicTrackId).toBe(pending.track.id);
		expect(pending.track.stop).not.toHaveBeenCalled();
	});

	it('is stopped when the preview microphone was stopped while the browser was still asking', async () => {
		const { mediaService, store, dispatch } = setup();
		const pending = deferredStream();

		getUserMedia.mockReturnValueOnce(pending.stream);

		const started = dispatch(updatePreviewMic());

		await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalled());
		await dispatch(stopPreviewMic());
		pending.resolve();
		await started;

		expect(pending.track.stop).toHaveBeenCalled();
		expect(mediaService.previewMicTrack).toBeNull();
		expect(store.getState().me.previewMicTrackId).toBeUndefined();
		expect(store.getState().me.audioInProgress).toBe(false);
	});

	it('is stopped when a newer preview microphone was asked for in the meantime', async () => {
		const { mediaService, dispatch } = setup();
		const older = deferredStream();
		const newer = deferredStream();

		getUserMedia.mockReturnValueOnce(older.stream).mockReturnValueOnce(newer.stream);

		const first = dispatch(updatePreviewMic());

		await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1));

		const second = dispatch(updatePreviewMic());

		await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2));
		newer.resolve();
		await second;
		older.resolve();
		await first;

		expect(older.track.stop).toHaveBeenCalled();
		expect(newer.track.stop).not.toHaveBeenCalled();
		expect(mediaService.previewMicTrack).toBe(newer.track);
	});

	it('is stopped, effect included, when the preview camera was stopped while the browser was still asking', async () => {
		const { mediaService, effectsService, store, dispatch } = setup();
		const pending = deferredStream();

		getUserMedia.mockReturnValueOnce(pending.stream);

		const started = dispatch(updatePreviewWebcam());

		await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalled());
		await dispatch(stopPreviewWebcam());
		pending.resolve();
		await started;

		expect(pending.track.stop).toHaveBeenCalled();
		expect(effectsService.stop).toHaveBeenCalledWith(pending.track.id);
		expect(mediaService.previewWebcamTrack).toBeNull();
		expect(store.getState().me.previewWebcamTrackId).toBeUndefined();
		expect(store.getState().me.videoInProgress).toBe(false);
	});
});
