import { describe, expect, it, vi } from 'vitest';

const media = vi.hoisted(() => ({
	service: {
		localCapabilities: {},
		previewMicTrack: null as object | null,
		previewWebcamTrack: null as object | null,
		previewMicRequest: 0,
		previewWebcamRequest: 0,
	},
	calls: [] as string[],
	micStarted: undefined as Promise<void> | undefined,
	takesPreview: true,
}));

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, browserWarnings: [] } }));
vi.mock('../store', () => ({ fileService: {} }));
vi.mock('./startActions', () => ({ stopListeners: vi.fn() }));
vi.mock('./recordingActions', () => ({ stopRecording: vi.fn() }));
vi.mock('./mediaActions', () => ({
	updateMic: () => async () => {
		media.calls.push('updateMic');
		await media.micStarted;
		if (media.takesPreview) media.service.previewMicTrack = null;
	},
	updateWebcam: () => async () => {
		media.calls.push('updateWebcam');
		if (media.takesPreview) media.service.previewWebcamTrack = null;
	},
	startExtraVideo: () => async () => {
		media.calls.push('startExtraVideo');
	},
	stopPreviewMic: () => async () => {
		media.calls.push('stopPreviewMic');
		media.service.previewMicRequest++;
		media.service.previewMicTrack = null;
	},
	stopPreviewWebcam: () => async () => {
		media.calls.push('stopPreviewWebcam');
		media.service.previewWebcamRequest++;
		media.service.previewWebcamTrack = null;
	},
}));

import { joinRoom } from './roomActions';

const joinResponse = {
	peers: [],
	chatHistory: [],
	fileHistory: [],
	countdownTimer: { isStarted: false },
	drawing: { isEnabled: false, bgColor: '#fff', canvasState: [] },
	breakoutRooms: [],
	locked: false,
	lobbyPeers: [],
};

const run = (me: Record<string, unknown> = {}, fromPrecall = true, sendRequest = vi.fn(async () => joinResponse)) => {
	const state = {
		settings: { displayName: 'Guest' },
		me: { sessionId: 's1', audioMuted: false, videoMuted: false, ...me },
	};
	const extra = {
		mediaService: media.service,
		signalingService: { sendRequest },
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const dispatch = (action: any): any => (typeof action === 'function' ? action(dispatch, () => state, extra) : action);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (joinRoom({ fromPrecall }) as any)(dispatch, () => state, extra) as Promise<void>;
};

const reset = (over: Partial<Pick<typeof media, 'takesPreview' | 'micStarted'>> = {}) => {
	media.service.previewMicTrack = { id: 'preview-mic' };
	media.service.previewWebcamTrack = { id: 'preview-webcam' };
	media.calls = [];
	media.micStarted = undefined;
	media.takesPreview = true;
	Object.assign(media, over);
};

const startingMedia = [ 'updateMic', 'updateWebcam' ];
const endingPreviews = [ 'stopPreviewMic', 'stopPreviewWebcam' ];

describe('joinRoom and the camera and microphone left on from the join screen or the lobby', () => {
	it('ends the previews once the room has started its media, after the room took the tracks over', async () => {
		reset();

		await run();

		expect(media.calls).toEqual([ ...startingMedia, ...endingPreviews ]);
	});

	it('turns them off when the room does not take them, for example without permission to share', async () => {
		reset({ takesPreview: false });

		await run();

		expect(media.calls).toEqual([ ...startingMedia, ...endingPreviews ]);
		expect(media.service.previewMicTrack).toBeNull();
		expect(media.service.previewWebcamTrack).toBeNull();
	});

	it('turns them off when the user joins with them muted', async () => {
		reset();

		await run({ audioMuted: true, videoMuted: true });

		expect(media.calls).toEqual(endingPreviews);
	});

	it('ends a preview the browser is still asking for, so it cannot turn on after joining', async () => {
		reset({ takesPreview: false });
		media.service.previewMicTrack = null;
		media.service.previewWebcamTrack = null;

		await run();

		expect(media.calls).toEqual([ ...startingMedia, ...endingPreviews ]);
	});

	it('waits for the room to start its microphone first, so capture never stops in between', async () => {
		let micStarted = (): void => undefined;

		reset({ micStarted: new Promise<void>((resolve) => { micStarted = resolve; }) });

		const joined = run();

		await vi.waitFor(() => expect(media.calls).toContain('updateWebcam'));
		expect(media.calls).not.toContain('stopPreviewMic');

		micStarted();
		await joined;

		expect(media.calls).toEqual([ ...startingMedia, ...endingPreviews ]);
	});

	it('does not turn off a preview asked for while joining, for example by the settings dialog', async () => {
		let micStarted = (): void => undefined;

		reset({ takesPreview: false, micStarted: new Promise<void>((resolve) => { micStarted = resolve; }) });

		const settingsPreview = { id: 'settings-mic' };
		const joined = run();

		await vi.waitFor(() => expect(media.calls).toContain('updateMic'));
		media.service.previewMicRequest++;
		media.service.previewMicTrack = settingsPreview;
		micStarted();
		await joined;

		expect(media.service.previewMicTrack).toBe(settingsPreview);
		expect(media.calls).toEqual([ ...startingMedia, 'stopPreviewWebcam' ]);
	});

	it('turns them off when the join request fails', async () => {
		reset();

		const failure = new Error('join failed');

		await expect(run({}, true, vi.fn(async () => { throw failure; }))).rejects.toBe(failure);

		expect(media.calls).toEqual(endingPreviews);
		expect(media.service.previewMicTrack).toBeNull();
	});

	it('does not touch a preview when the room is joined again after a long disconnect', async () => {
		reset({ takesPreview: false });

		await run({}, false);

		expect(media.calls).toEqual(startingMedia);
		expect(media.service.previewMicTrack).toEqual({ id: 'preview-mic' });
	});
});
