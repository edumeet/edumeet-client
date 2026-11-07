import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, askForMediaOnJoin: true, simulcast: true, simulcastSharing: true, browserWarnings: [] } }));
vi.mock('../../utils/deviceInfo', () => ({ deviceInfo: () => ({ name: 'test', version: '1', platform: 'test' }) }));
vi.mock('../../services/mediaService', () => ({}));
vi.mock('../store', () => ({}));
vi.mock('../selectors', () => ({ isInsertableStreamsSupported: () => false }));
vi.mock('../actions/roomActions', () => ({ joinRoom: vi.fn(), leaveRoom: vi.fn() }));
vi.mock('../actions/meActions', () => ({ setDisplayName: vi.fn(), setPicture: vi.fn() }));
vi.mock('../actions/mediaActions', () => ({
	pauseMic: () => ({ type: 'pauseMic' }),
	startExtraVideo: () => ({ type: 'startExtraVideo' }),
	updateMic: () => ({ type: 'updateMic' }),
	updateWebcam: () => ({ type: 'updateWebcam' }),
}));
vi.mock('../actions/meetingTokenActions', () => ({ meetingTokenRejected: vi.fn() }));
vi.mock('../../components/translated/translatedComponents', () => ({ roomE2eeUnsupportedLabel: () => 'e2ee unsupported' }));

import createRoomMiddleware from './roomMiddleware';
import { signalingActions } from '../slices/signalingSlice';

type SignalingNotification = { method: string; data: Record<string, unknown> };
// eslint-disable-next-line no-unused-vars
type NotificationHandler = (notification: SignalingNotification) => void;
type MiddlewareInput = Parameters<typeof createRoomMiddleware>[0];
type ApiInput = Parameters<ReturnType<typeof createRoomMiddleware>>[0];

const mediaAfterReconnect = async (me: Record<string, unknown>) => {
	let handler: NotificationHandler | undefined;
	const signalingService = {
		on: vi.fn((event: string, cb: NotificationHandler) => {
			if (event === 'notification') handler = cb;
		}),
	};
	const mediaService = { setMonitorAttachments: vi.fn() };
	const started: string[] = [];
	const dispatch = vi.fn((action: { type: string }) => {
		if ([ 'updateMic', 'pauseMic', 'updateWebcam' ].includes(action.type)) {
			started.push(action.type);

			return Promise.resolve();
		}

		return action;
	});
	const middleware = createRoomMiddleware({ signalingService, mediaService } as unknown as MiddlewareInput);
	const getState = () => ({ room: { state: 'joined' }, me: { videoMuted: true, ...me }, settings: {} });

	middleware({ dispatch, getState } as unknown as ApiInput)(vi.fn())(signalingActions.connect());

	handler?.({
		method: 'peerReconnected',
		data: {
			sessionId: 's1',
			peers: [],
			chatHistory: [],
			fileHistory: [],
			breakoutRooms: [],
			lobbyPeers: [],
			locked: false,
			drawing: { isEnabled: false, bgColor: '#fff', canvasState: [] },
			countdownTimer: { isStarted: false },
		},
	});

	await Promise.resolve();
	await Promise.resolve();

	return started;
};

describe('peerReconnected brings the microphone back as it was', () => {
	it('leaves a microphone that was off turned off', async () => {
		expect(await mediaAfterReconnect({ micEnabled: false, audioMuted: true })).toEqual([]);
	});

	it('brings a muted microphone back muted', async () => {
		expect(await mediaAfterReconnect({ micEnabled: true, audioMuted: true })).toEqual([ 'updateMic', 'pauseMic' ]);
	});

	it('brings a microphone that was on back on', async () => {
		expect(await mediaAfterReconnect({ micEnabled: true, audioMuted: false })).toEqual([ 'updateMic' ]);
	});

	it('restarts a microphone the server closed while it was on', async () => {
		expect(await mediaAfterReconnect({ micEnabled: false, audioMuted: true, lostAudio: true })).toEqual([ 'updateMic' ]);
	});
});
