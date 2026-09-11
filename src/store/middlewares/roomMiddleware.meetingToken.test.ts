import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, askForMediaOnJoin: true, simulcast: true, simulcastSharing: true, browserWarnings: [] } }));
vi.mock('../../utils/deviceInfo', () => ({ deviceInfo: () => ({ name: 'test', version: '1', platform: 'test' }) }));
vi.mock('../../services/mediaService', () => ({}));
vi.mock('../store', () => ({}));
vi.mock('../selectors', () => ({ isInsertableStreamsSupported: () => true }));
vi.mock('../actions/roomActions', () => ({ joinRoom: vi.fn(() => ({ type: 'joinRoom' })), leaveRoom: vi.fn(() => ({ type: 'leaveRoom' })) }));
vi.mock('../actions/meActions', () => ({ setDisplayName: vi.fn(), setPicture: vi.fn() }));
vi.mock('../actions/mediaActions', () => ({ pauseMic: vi.fn(), startExtraVideo: vi.fn(), updateMic: vi.fn(), updateWebcam: vi.fn() }));
vi.mock('../actions/meetingTokenActions', () => ({ meetingTokenRejected: vi.fn((reason: string) => ({ type: 'meetingTokenRejected', payload: reason })) }));
vi.mock('../../components/translated/translatedComponents', () => ({ roomE2eeUnsupportedLabel: () => 'e2ee unsupported' }));

import createRoomMiddleware from './roomMiddleware';
import { signalingActions } from '../slices/signalingSlice';
import { meetingTokenRejected } from '../actions/meetingTokenActions';

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

	return { dispatch, deliver: (method: string, data: Record<string, unknown>) => handler?.({ method, data }) };
};

describe('roomMiddleware on meetingTokenRejected', () => {
	it('hands the server\'s reason to the rejection thunk', () => {
		const { dispatch, deliver } = setup();

		deliver('meetingTokenRejected', { reason: 'invalid' });

		expect(meetingTokenRejected).toHaveBeenCalledWith('invalid');
		expect(dispatch).toHaveBeenCalledWith({ type: 'meetingTokenRejected', payload: 'invalid' });
	});

	it('does not treat the rejection as a leave', () => {
		const { dispatch, deliver } = setup();

		deliver('meetingTokenRejected', { reason: 'required' });

		expect(dispatch).not.toHaveBeenCalledWith({ type: 'leaveRoom' });
	});
});
