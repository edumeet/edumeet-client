import { describe, expect, it, vi } from 'vitest';

const config = vi.hoisted(() => ({ theme: {}, browserWarnings: [], largeRoomThreshold: 3 as number | undefined }));
const calls = vi.hoisted(() => [] as string[]);

vi.mock('../../utils/edumeetConfig', () => ({ default: config }));
vi.mock('../store', () => ({ fileService: {} }));
vi.mock('./startActions', () => ({ stopListeners: vi.fn() }));
vi.mock('./recordingActions', () => ({ stopRecording: vi.fn() }));
vi.mock('../../components/translated/translatedComponents', () => ({ largeRoomMediaOffLabel: () => 'large room' }));
vi.mock('./mediaActions', () => ({
	updateMic: () => async () => { calls.push('updateMic'); },
	updateWebcam: () => async () => { calls.push('updateWebcam'); },
	startExtraVideo: () => async () => { calls.push('startExtraVideo'); },
	stopPreviewMic: () => async () => undefined,
	stopPreviewWebcam: () => async () => undefined,
}));

import { joinRoom } from './roomActions';

const peers = (count: number, bots = 0) => [
	...Array.from({ length: count }, (_, i) => ({ id: `p${i}` })),
	...Array.from({ length: bots }, (_, i) => ({ id: `b${i}`, headless: true })),
];

const run = async ({ peerCount, bots = 0, me = {}, fromPrecall = true }: { peerCount: number; bots?: number; me?: Record<string, unknown>; fromPrecall?: boolean }) => {
	calls.length = 0;

	const actions: { type: string; payload?: unknown }[] = [];
	const state = {
		settings: { displayName: 'Guest' },
		me: { sessionId: 's1', audioMuted: false, videoMuted: false, ...me },
	};
	const joinResponse = {
		peers: peers(peerCount, bots),
		chatHistory: [],
		fileHistory: [],
		countdownTimer: { isStarted: false },
		drawing: { isEnabled: false, bgColor: '#fff', canvasState: [] },
		breakoutRooms: [],
		locked: false,
		lobbyPeers: [],
	};
	const extra = {
		mediaService: { localCapabilities: {}, previewMicRequest: 0, previewWebcamRequest: 0 },
		signalingService: { sendRequest: vi.fn(async () => joinResponse) },
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const dispatch = (action: any): any => {
		if (typeof action === 'function') return action(dispatch, () => state, extra);
		actions.push(action);

		return action;
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await (joinRoom({ fromPrecall }) as any)(dispatch, () => state, extra);

	return {
		calls: [ ...calls ],
		muted: actions.filter((a) => (a.type === 'me/setAudioMuted' || a.type === 'me/setVideoMuted') && a.payload === true).map((a) => a.type),
		notified: actions.some((a) => a.type === 'notifications/enqueueNotification'),
	};
};

describe('joining a large room', () => {
	it('starts with microphone and camera off and says why', async () => {
		config.largeRoomThreshold = 3;

		const result = await run({ peerCount: 3 });

		expect(result.calls).toEqual([]);
		expect(result.muted).toEqual([ 'me/setAudioMuted', 'me/setVideoMuted' ]);
		expect(result.notified).toBe(true);
	});

	it('starts them as chosen below the threshold', async () => {
		config.largeRoomThreshold = 3;

		const result = await run({ peerCount: 2 });

		expect(result.calls).toEqual([ 'updateMic', 'updateWebcam' ]);
		expect(result.muted).toEqual([]);
		expect(result.notified).toBe(false);
	});

	it('does not count bots, as the participant count does not', async () => {
		config.largeRoomThreshold = 3;

		const result = await run({ peerCount: 2, bots: 5 });

		expect(result.calls).toEqual([ 'updateMic', 'updateWebcam' ]);
		expect(result.notified).toBe(false);
	});

	it('has no limit with -1', async () => {
		config.largeRoomThreshold = -1;

		const result = await run({ peerCount: 500 });

		expect(result.calls).toEqual([ 'updateMic', 'updateWebcam' ]);
		expect(result.notified).toBe(false);
	});

	it('has no limit when the config does not set one', async () => {
		config.largeRoomThreshold = undefined;

		const result = await run({ peerCount: 500 });

		expect(result.calls).toEqual([ 'updateMic', 'updateWebcam' ]);
		expect(result.notified).toBe(false);
	});

	it('says nothing to someone who joins with both off already', async () => {
		config.largeRoomThreshold = 3;

		const result = await run({ peerCount: 10, me: { audioMuted: true, videoMuted: true } });

		expect(result.calls).toEqual([]);
		expect(result.notified).toBe(false);
	});

	it('keeps the media of someone back after a long disconnect', async () => {
		config.largeRoomThreshold = 3;

		const result = await run({ peerCount: 10, fromPrecall: false });

		expect(result.calls).toEqual([ 'updateMic', 'updateWebcam' ]);
		expect(result.notified).toBe(false);
	});

	it('restarts media lost in a long disconnect', async () => {
		config.largeRoomThreshold = 3;

		const result = await run({ peerCount: 10, fromPrecall: false, me: { audioMuted: true, videoMuted: true, lostAudio: true, lostVideo: true } });

		expect(result.calls).toEqual([ 'updateMic', 'updateWebcam' ]);
	});
});
