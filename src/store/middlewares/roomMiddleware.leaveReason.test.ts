import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, askForMediaOnJoin: true, simulcast: true, simulcastSharing: true, browserWarnings: [] } }));
vi.mock('../../utils/deviceInfo', () => ({ deviceInfo: () => ({ name: 'test', version: '1', platform: 'test' }) }));
vi.mock('../../services/mediaService', () => ({}));
vi.mock('../store', () => ({}));
vi.mock('../selectors', () => ({ isInsertableStreamsSupported: () => false }));
vi.mock('../actions/roomActions', () => ({ joinRoom: vi.fn(() => ({ type: 'joinRoom' })), leaveRoom: vi.fn(() => ({ type: 'leaveRoom' })) }));
vi.mock('../actions/meActions', () => ({ setDisplayName: vi.fn(), setPicture: vi.fn() }));
vi.mock('../actions/mediaActions', () => ({ pauseMic: vi.fn(), startExtraVideo: vi.fn(), updateMic: vi.fn(), updateWebcam: vi.fn() }));
vi.mock('../actions/meetingTokenActions', () => ({ meetingTokenRejected: vi.fn((reason: string) => ({ type: 'meetingTokenRejected', payload: reason })) }));
vi.mock('../../components/translated/translatedComponents', () => ({ roomE2eeUnsupportedLabel: () => 'e2ee unsupported' }));

import createRoomMiddleware from './roomMiddleware';
import { signalingActions } from '../slices/signalingSlice';
import { roomActions } from '../slices/roomSlice';

type SignalingNotification = { method: string; data: Record<string, unknown> };
// eslint-disable-next-line no-unused-vars
type NotificationHandler = (notification: SignalingNotification) => void;
type MiddlewareInput = Parameters<typeof createRoomMiddleware>[0];
type ApiInput = Parameters<ReturnType<typeof createRoomMiddleware>>[0];

const setup = () => {
	let handler: NotificationHandler | undefined;
	const signalingService = {
		on: vi.fn((event: string, cb: NotificationHandler) => {
			if (event === 'notification') handler = cb;
		}),
	};
	const dispatch = vi.fn();
	const middleware = createRoomMiddleware({ signalingService } as unknown as MiddlewareInput);
	const invoke = middleware({ dispatch, getState: () => ({ room: { state: 'new' }, me: {}, settings: {} }) } as unknown as ApiInput)(vi.fn());

	invoke(signalingActions.connect());

	const calls = () => dispatch.mock.calls.map(([ action ]) => action);

	return { dispatch, calls, deliver: (method: string, data: Record<string, unknown> = {}) => handler?.({ method, data }) };
};

describe('roomMiddleware leave reasons', () => {
	it('names a kick before leaving', () => {
		const { calls, deliver } = setup();

		deliver('moderator:kick');

		expect(calls()).toEqual([ roomActions.setLeaveReason('kicked'), { type: 'leaveRoom' } ]);
	});

	it('names the end of the meeting before leaving', () => {
		const { calls, deliver } = setup();

		deliver('escapeMeeting');

		expect(calls()).toEqual([ roomActions.setLeaveReason('meetingEnded'), { type: 'leaveRoom' } ]);
	});

	it('names the room server\'s refusal of a bot, and ignores an unknown reason', () => {
		const { calls, deliver } = setup();

		deliver('botRejected', { reason: 'botTokenRejected' });
		deliver('botRejected', { reason: 'something-else' });

		expect(calls()).toEqual([ roomActions.setLeaveReason('botTokenRejected') ]);
	});

	it('names an unsupported browser when an encrypted room refuses it', () => {
		const { calls, deliver } = setup();

		deliver('enteredLobby', { endToEndEncryption: true });

		const types = calls().map((action) => action.type);

		expect(calls()).toContainEqual(roomActions.setLeaveReason('e2eeUnsupported'));
		expect(types.indexOf(roomActions.setLeaveReason.type)).toBeLessThan(types.indexOf(roomActions.setState.type));
	});
});
