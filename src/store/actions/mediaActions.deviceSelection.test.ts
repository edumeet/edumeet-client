import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, noiseThreshold: -60, resolution: 'medium', aspectRatio: 1.778, frameRate: 30 } }));
vi.mock('../store', () => ({}));
vi.mock('../../services/clientImageService', () => ({}));

import { configureStore } from '@reduxjs/toolkit';
import meSlice, { meActions } from '../slices/meSlice';
import settingsSlice, { settingsActions } from '../slices/settingsSlice';
import permissionsSlice, { permissionsActions } from '../slices/permissionsSlice';
import notificationsSlice from '../slices/notificationsSlice';
import { permissions } from '../../utils/roles';
import { updateMic, updateWebcam } from './mediaActions';

type FakeTrack = { id: string; stop: ReturnType<typeof vi.fn>; getSettings: () => { deviceId: string } };

const fakeTrack = (deviceId: string): FakeTrack => ({ id: `${deviceId}-track`, stop: vi.fn(), getSettings: () => ({ deviceId }) });

const fakeSender = (running: FakeTrack | null) => {
	const volumeWatcher = { setThreshold: vi.fn() };
	const sender = {
		running: Boolean(running),
		track: running,
		volumeWatcher: running ? volumeWatcher : undefined,
		start: vi.fn(async ({ track }: { track: FakeTrack }) => {
			sender.running = true;
			sender.track = track;
			sender.volumeWatcher = volumeWatcher;
		}),
		replaceTrack: vi.fn(async (track: FakeTrack) => {
			sender.track = track;
		}),
	};

	return { sender, volumeWatcher };
};

const setup = ({ mic = null, webcam = null }: { mic?: FakeTrack | null; webcam?: FakeTrack | null } = {}) => {
	const micSender = fakeSender(mic);
	const webcamSender = fakeSender(webcam);
	const mediaService = {
		previewMicTrack: null as FakeTrack | null,
		previewWebcamTrack: null as FakeTrack | null,
		mediaSenders: { mic: micSender.sender, webcam: webcamSender.sender },
	};
	const deviceService = { getDeviceId: vi.fn((deviceId?: string) => deviceId ?? 'default') };
	const effectsService = { effectTracks: new Map(), stop: vi.fn(), applyEffect: vi.fn() };
	const store = configureStore({
		reducer: { me: meSlice.reducer, settings: settingsSlice.reducer, permissions: permissionsSlice.reducer, notifications: notificationsSlice.reducer },
		middleware: (getDefaultMiddleware) => getDefaultMiddleware({
			thunk: { extraArgument: { mediaService, deviceService, effectsService, config: {} } },
			serializableCheck: false,
			immutableCheck: false,
		}),
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const dispatch = (thunk: unknown) => store.dispatch(thunk as any) as Promise<void>;

	store.dispatch(permissionsActions.setPermissions([ permissions.SHARE_AUDIO, permissions.SHARE_VIDEO ]));

	if (mic) {
		store.dispatch(settingsActions.setSelectedAudioDevice(mic.getSettings().deviceId));
		store.dispatch(meActions.setMicEnabled(true));
	}

	if (webcam) {
		store.dispatch(settingsActions.setSelectedVideoDevice(webcam.getSettings().deviceId));
		store.dispatch(meActions.setWebcamEnabled(true));
	}

	return { mediaService, deviceService, micSender: micSender.sender, webcamSender: webcamSender.sender, micWatcher: micSender.volumeWatcher, store, dispatch };
};

type Constraints = { audio?: { deviceId?: { exact: string } }; video?: { deviceId?: { exact: string } } };

const requestedDevice = (constraints: Constraints): string =>
	(constraints.audio ?? constraints.video)?.deviceId?.exact ?? 'browser-default';

describe('choosing a microphone or camera', () => {
	const getUserMedia = vi.fn();

	beforeEach(() => {
		getUserMedia.mockImplementation(async (constraints: Constraints) => {
			const track = fakeTrack(requestedDevice(constraints));

			return { getAudioTracks: () => [ track ], getVideoTracks: () => [ track ] };
		});
		vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
	});
	afterEach(() => {
		vi.unstubAllGlobals();
		getUserMedia.mockReset();
	});

	it('turns the microphone on with the selected microphone, not the first one', async () => {
		const { store, dispatch } = setup();

		store.dispatch(settingsActions.setSelectedAudioDevice('headset'));
		await dispatch(updateMic());

		expect(requestedDevice(getUserMedia.mock.calls[0][0])).toBe('headset');
		expect(store.getState().settings.selectedAudioDevice).toBe('headset');
		expect(store.getState().me.micEnabled).toBe(true);
	});

	it('applies the saved noise threshold to the microphone volume meter', async () => {
		const { micWatcher, store, dispatch } = setup();

		store.dispatch(settingsActions.setNoiseThreshold(-45));
		await dispatch(updateMic());

		expect(micWatcher.setThreshold).toHaveBeenCalledWith(-45);
	});

	it('selects the new microphone once the switch works', async () => {
		const { store, dispatch } = setup({ mic: fakeTrack('laptop') });

		await dispatch(updateMic({ newDeviceId: 'headset' }));

		expect(requestedDevice(getUserMedia.mock.calls[0][0])).toBe('headset');
		expect(store.getState().settings.selectedAudioDevice).toBe('headset');
	});

	it('keeps the microphone that is sent selected when the switch fails', async () => {
		const { store, dispatch } = setup({ mic: fakeTrack('laptop') });

		getUserMedia.mockRejectedValueOnce(new DOMException('busy', 'NotReadableError'));
		await dispatch(updateMic({ newDeviceId: 'headset' }));

		expect(requestedDevice(getUserMedia.mock.calls[0][0])).toBe('headset');
		expect(store.getState().settings.selectedAudioDevice).toBe('laptop');
		expect(store.getState().me.micEnabled).toBe(true);
	});

	it('keeps the microphone that is sent selected when the new one cannot be sent', async () => {
		const { micSender, store, dispatch } = setup({ mic: fakeTrack('laptop') });

		micSender.replaceTrack.mockRejectedValueOnce(new Error('producer closed'));
		await dispatch(updateMic({ newDeviceId: 'headset' }));

		expect(store.getState().settings.selectedAudioDevice).toBe('laptop');
	});

	it('does not start a microphone again that was stopped during the switch, but keeps the choice', async () => {
		const { micSender, store, dispatch } = setup({ mic: fakeTrack('laptop') });
		const headset = fakeTrack('headset');

		getUserMedia.mockImplementationOnce(async () => {
			micSender.running = false;

			return { getAudioTracks: () => [ headset ] };
		});
		await dispatch(updateMic({ newDeviceId: 'headset' }));

		expect(micSender.start).not.toHaveBeenCalled();
		expect(micSender.replaceTrack).not.toHaveBeenCalled();
		expect(headset.stop).toHaveBeenCalled();
		expect(store.getState().settings.selectedAudioDevice).toBe('headset');
	});

	it('leaves the microphone off when it is stopped while the new track is attached', async () => {
		const { micSender, store, dispatch } = setup({ mic: fakeTrack('laptop') });

		micSender.replaceTrack.mockImplementationOnce(async () => {
			micSender.running = false;
			store.dispatch(meActions.setMicEnabled(false));
		});
		await dispatch(updateMic({ newDeviceId: 'headset' }));

		expect(store.getState().me.micEnabled).toBe(false);
	});

	it('leaves an open preview microphone to its owner when switching', async () => {
		const { mediaService, store, dispatch } = setup({ mic: fakeTrack('laptop') });
		const preview = fakeTrack('headset');

		mediaService.previewMicTrack = preview;
		store.dispatch(meActions.setPreviewMicTrackId(preview.id));
		await dispatch(updateMic({ newDeviceId: 'headset' }));

		expect(store.getState().me.previewMicTrackId).toBe(preview.id);
		expect(mediaService.previewMicTrack).toBe(preview);
	});

	it('does not start a camera again that was stopped during the switch, but keeps the choice', async () => {
		const { webcamSender, store, dispatch } = setup({ webcam: fakeTrack('built-in') });
		const usbCamera = fakeTrack('usb-camera');

		getUserMedia.mockImplementationOnce(async () => {
			webcamSender.running = false;

			return { getVideoTracks: () => [ usbCamera ] };
		});
		await dispatch(updateWebcam({ newDeviceId: 'usb-camera' }));

		expect(webcamSender.start).not.toHaveBeenCalled();
		expect(webcamSender.replaceTrack).not.toHaveBeenCalled();
		expect(usbCamera.stop).toHaveBeenCalled();
		expect(store.getState().settings.selectedVideoDevice).toBe('usb-camera');
	});

	it('uses the default microphone when the selected one cannot be opened', async () => {
		const { store, dispatch } = setup();

		store.dispatch(settingsActions.setSelectedAudioDevice('headset'));
		getUserMedia.mockRejectedValueOnce(new DOMException('busy', 'NotReadableError'));
		await dispatch(updateMic());

		expect(getUserMedia.mock.calls.map(([ constraints ]) => requestedDevice(constraints))).toEqual([ 'headset', 'browser-default' ]);
		expect(store.getState().me.micEnabled).toBe(true);
		expect(store.getState().settings.selectedAudioDevice).toBe('browser-default');
	});

	it('starts a microphone that is on but muted muted again, also when a device is picked meanwhile', async () => {
		const { micSender, store, dispatch } = setup();

		store.dispatch(meActions.setMicEnabled(true));
		store.dispatch(meActions.setAudioMuted(true));
		await dispatch(updateMic({ newDeviceId: 'headset' }));

		expect(micSender.start).toHaveBeenCalledWith(expect.anything(), { paused: true });
		expect(store.getState().me.audioMuted).toBe(true);
	});

	it('does not fall back when the browser refuses the microphone', async () => {
		const { store, dispatch } = setup();

		store.dispatch(settingsActions.setSelectedAudioDevice('headset'));
		getUserMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'));
		await dispatch(updateMic());

		expect(getUserMedia).toHaveBeenCalledTimes(1);
		expect(store.getState().me.micEnabled).toBe(false);
	});

	it('does not fall back when a switch to a chosen microphone fails', async () => {
		const { dispatch } = setup({ mic: fakeTrack('laptop') });

		getUserMedia.mockRejectedValueOnce(new DOMException('busy', 'NotReadableError'));
		await dispatch(updateMic({ newDeviceId: 'headset' }));

		expect(getUserMedia).toHaveBeenCalledTimes(1);
	});

	it('shows the microphone off when it cannot be started again after a reconnect', async () => {
		const { store, dispatch } = setup();

		store.dispatch(meActions.setMicEnabled(true));
		store.dispatch(meActions.setMicTrackId('old-track'));
		getUserMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'));
		await dispatch(updateMic());

		expect(store.getState().me.micEnabled).toBe(false);
		expect(store.getState().me.micTrackId).toBeUndefined();
	});

	it('shows the camera off when it cannot be started again after a reconnect', async () => {
		const { store, dispatch } = setup();

		store.dispatch(meActions.setWebcamEnabled(true));
		getUserMedia.mockRejectedValueOnce(new DOMException('gone', 'NotFoundError'));
		await dispatch(updateWebcam());

		expect(store.getState().me.webcamEnabled).toBe(false);
	});

	it('starts the new microphone, unmuted, when the old one was lost during the switch', async () => {
		const { micSender, store, dispatch } = setup({ mic: fakeTrack('laptop') });
		const headset = fakeTrack('headset');

		getUserMedia.mockImplementationOnce(async () => {
			micSender.running = false;
			store.dispatch(meActions.setLostAudio(true));
			store.dispatch(meActions.setAudioMuted(true));
			store.dispatch(meActions.setMicEnabled(false));

			return { getAudioTracks: () => [ headset ] };
		});
		await dispatch(updateMic({ newDeviceId: 'headset' }));

		expect(micSender.start).toHaveBeenCalled();
		expect(store.getState().me.micEnabled).toBe(true);
		expect(store.getState().me.audioMuted).toBe(false);
		expect(store.getState().me.lostAudio).toBe(false);
	});

	it('starts the new camera when the old one was lost during the switch', async () => {
		const { webcamSender, store, dispatch } = setup({ webcam: fakeTrack('built-in') });
		const usbCamera = fakeTrack('usb-camera');

		getUserMedia.mockImplementationOnce(async () => {
			webcamSender.running = false;
			store.dispatch(meActions.setLostVideo(true));
			store.dispatch(meActions.setWebcamEnabled(false));

			return { getVideoTracks: () => [ usbCamera ] };
		});
		await dispatch(updateWebcam({ newDeviceId: 'usb-camera' }));

		expect(webcamSender.start).toHaveBeenCalled();
		expect(store.getState().me.webcamEnabled).toBe(true);
		expect(store.getState().me.lostVideo).toBe(false);
	});

	it('starts a muted microphone paused, so it never sends a moment unmuted', async () => {
		const { micSender, store, dispatch } = setup();

		await dispatch(updateMic({ startMuted: true }));

		expect(micSender.start).toHaveBeenCalledWith(expect.anything(), { paused: true });
		expect(store.getState().me.audioMuted).toBe(true);
		expect(store.getState().me.micEnabled).toBe(true);
	});

	it('forgets an earlier lost microphone once it is on again, or turned off', async () => {
		const { store, dispatch } = setup();

		store.dispatch(meActions.setLostAudio(true));
		await dispatch(updateMic());

		expect(store.getState().me.lostAudio).toBe(false);
	});

	it('leaves the microphone state to a reconnect that stops it during a switch', async () => {
		const { micSender, store, dispatch } = setup({ mic: fakeTrack('laptop') });

		micSender.replaceTrack.mockImplementationOnce(async () => {
			micSender.running = false;
			throw new Error('Not producing');
		});
		await dispatch(updateMic({ newDeviceId: 'headset' }));

		expect(store.getState().me.micEnabled).toBe(true);
	});

	it('keeps the camera that is sent selected when the switch fails', async () => {
		const { store, dispatch } = setup({ webcam: fakeTrack('built-in') });

		getUserMedia.mockRejectedValueOnce(new DOMException('busy', 'NotReadableError'));
		await dispatch(updateWebcam({ newDeviceId: 'usb-camera' }));

		expect(requestedDevice(getUserMedia.mock.calls[0][0])).toBe('usb-camera');
		expect(store.getState().settings.selectedVideoDevice).toBe('built-in');
		expect(store.getState().me.webcamEnabled).toBe(true);
	});
});
