import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, askForMediaOnJoin: true, simulcast: true, simulcastSharing: true, browserWarnings: [] } }));
vi.mock('../../utils/deviceInfo', () => ({ deviceInfo: () => ({ name: 'test', version: '1', platform: 'test' }) }));
vi.mock('../../services/mediaService', () => ({}));
vi.mock('../store', () => ({}));
vi.mock('../selectors', () => ({ isInsertableStreamsSupported: () => false }));
vi.mock('../actions/roomActions', () => ({
	joinRoom: vi.fn((options: unknown) => ({ type: 'joinRoom', payload: options })),
	leaveRoom: vi.fn(() => ({ type: 'leaveRoom' }))
}));
vi.mock('../actions/meActions', () => ({ setDisplayName: vi.fn(), setPicture: vi.fn() }));
vi.mock('../actions/mediaActions', () => ({ pauseMic: vi.fn(), startExtraVideo: vi.fn(), updateMic: vi.fn(), updateWebcam: vi.fn() }));
vi.mock('../actions/meetingTokenActions', () => ({ meetingTokenRejected: vi.fn() }));
vi.mock('../../components/translated/translatedComponents', () => ({ roomE2eeUnsupportedLabel: () => 'e2ee unsupported' }));

import createRoomMiddleware from './roomMiddleware';
import { signalingActions } from '../slices/signalingSlice';
import { RoomConnectionState } from '../slices/roomSlice';

type SignalingNotification = { method: string; data: Record<string, unknown> };
// eslint-disable-next-line no-unused-vars
type NotificationHandler = (notification: SignalingNotification) => void;
type MiddlewareInput = Parameters<typeof createRoomMiddleware>[0];
type ApiInput = Parameters<ReturnType<typeof createRoomMiddleware>>[0];

const joinRoomOptionsOnRoomReady = (roomState: RoomConnectionState) => {
	let handler: NotificationHandler | undefined;
	const signalingService = {
		on: vi.fn((event: string, cb: NotificationHandler) => {
			if (event === 'notification') handler = cb;
		}),
	};
	const mediaService = { setMonitorAttachments: vi.fn() };
	const dispatch = vi.fn();
	const middleware = createRoomMiddleware({ signalingService, mediaService } as unknown as MiddlewareInput);
	const getState = () => ({ room: { state: roomState }, me: {}, settings: {} });

	middleware({ dispatch, getState } as unknown as ApiInput)(vi.fn())(signalingActions.connect());

	handler?.({ method: 'roomReady', data: { sessionId: 's1', settings: {} } });

	return dispatch.mock.calls.map(([ action ]) => action).find((action) => action.type === 'joinRoom')?.payload;
};

describe('roomReady tells joinRoom where the user comes from', () => {
	it('from the join screen', () => {
		expect(joinRoomOptionsOnRoomReady('new')).toEqual({ fromPrecall: true });
	});

	it('from the lobby', () => {
		expect(joinRoomOptionsOnRoomReady('lobby')).toEqual({ fromPrecall: true });
	});

	it('not from either when the room is joined again after a long disconnect', () => {
		expect(joinRoomOptionsOnRoomReady('joined')).toEqual({ fromPrecall: false });
	});
});
