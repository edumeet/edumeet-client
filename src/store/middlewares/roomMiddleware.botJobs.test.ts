import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, askForMediaOnJoin: true, simulcast: true, simulcastSharing: true, browserWarnings: [] } }));
vi.mock('../../utils/deviceInfo', () => ({ deviceInfo: () => ({ name: 'test', version: '1', platform: 'test' }) }));
vi.mock('../../services/mediaService', () => ({}));
vi.mock('../store', () => ({}));
vi.mock('../selectors', () => ({ isInsertableStreamsSupported: () => false }));
vi.mock('../actions/roomActions', () => ({ joinRoom: vi.fn(() => ({ type: 'joinRoom' })), leaveRoom: vi.fn(() => ({ type: 'leaveRoom' })) }));
vi.mock('../actions/meActions', () => ({ setDisplayName: vi.fn(), setPicture: vi.fn() }));
vi.mock('../actions/mediaActions', () => ({ pauseMic: vi.fn(), startExtraVideo: vi.fn(), updateMic: vi.fn(), updateWebcam: vi.fn() }));
vi.mock('../actions/meetingTokenActions', () => ({ meetingTokenRejected: vi.fn() }));
vi.mock('../../components/translated/translatedComponents', () => ({
	roomE2eeUnsupportedLabel: () => 'e2ee unsupported',
	botJobFailedLabel: (name: string) => `${name} has stopped unexpectedly`,
}));

import createRoomMiddleware from './roomMiddleware';
import { signalingActions } from '../slices/signalingSlice';
import { roomActions } from '../slices/roomSlice';
import { botJobsActions } from '../slices/botJobsSlice';
import { notificationsActions } from '../slices/notificationsSlice';
import { BOT_RETRY_WINDOW_MS } from '../../utils/botJobs';

type SignalingNotification = { method: string; data: Record<string, unknown> };
// eslint-disable-next-line no-unused-vars
type NotificationHandler = (notification: SignalingNotification) => void;
type MiddlewareInput = Parameters<typeof createRoomMiddleware>[0];
type ApiInput = Parameters<ReturnType<typeof createRoomMiddleware>>[0];

const jobId = '5b2f1c1e-0000-4000-8000-000000000000';

const setup = (me: Record<string, unknown> = {}, room: Record<string, unknown> = {}) => {
	let handler: NotificationHandler | undefined;
	const signalingService = {
		on: vi.fn((event: string, cb: NotificationHandler) => {
			if (event === 'notification') handler = cb;
		}),
	};
	const mediaService = { setMonitorAttachments: vi.fn() };
	const dispatch = vi.fn();
	const middleware = createRoomMiddleware({ signalingService, mediaService } as unknown as MiddlewareInput);
	const invoke = middleware({ dispatch, getState: () => ({ room: { state: 'new', ...room }, me, settings: { displayName: 'Acme Recorder' } }) } as unknown as ApiInput)(vi.fn());

	invoke(signalingActions.connect());

	const calls = () => dispatch.mock.calls.map(([ action ]) => action);

	return { calls, mediaService, deliver: (method: string, data: Record<string, unknown> = {}) => handler?.({ method, data }) };
};

const roomReady = { sessionId: 's', creationTimestamp: 1, maxActiveVideos: 12, breakoutsEnabled: true, chatEnabled: true, filesharingEnabled: true, raiseHandEnabled: true, reactionsEnabled: true, localRecordingEnabled: true, endToEndEncryption: false, settings: {} };

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(0);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('the page of a bot that finds the room not open', () => {
	it('tries again and says nothing of it on the document', () => {
		const { calls, deliver } = setup({ botId: jobId });

		deliver('botRejected', { reason: 'roomNotOpen' });

		expect(calls()).toEqual([ signalingActions.retry() ]);
	});

	it('gives up with the reason once the window has passed', () => {
		const { calls, deliver } = setup({ botId: jobId });

		deliver('botRejected', { reason: 'roomNotOpen' });
		vi.setSystemTime(BOT_RETRY_WINDOW_MS);
		deliver('botRejected', { reason: 'roomNotOpen' });

		expect(calls()).toEqual([ signalingActions.retry(), roomActions.setLeaveReason('roomNotOpen') ]);
	});

	it('gets a whole new window once it has been in the room', () => {
		const { calls, deliver } = setup({ botId: jobId });

		deliver('botRejected', { reason: 'roomNotOpen' });
		vi.setSystemTime(BOT_RETRY_WINDOW_MS);
		deliver('roomReady', {});
		deliver('botRejected', { reason: 'roomNotOpen' });

		expect(calls().filter((action) => action.type === signalingActions.retry.type)).toHaveLength(2);
		expect(calls()).not.toContainEqual(roomActions.setLeaveReason('roomNotOpen'));
	});

	it('does not try again for any other refusal', () => {
		const { calls, deliver } = setup({ botId: jobId });

		deliver('botRejected', { reason: 'jobNotActive' });

		expect(calls()).toEqual([ roomActions.setLeaveReason('jobNotActive') ]);
	});

	it('does not try again without a bot id', () => {
		const { calls, deliver } = setup();

		deliver('botRejected', { reason: 'roomNotOpen' });

		expect(calls()).toEqual([ roomActions.setLeaveReason('roomNotOpen') ]);
	});
});

describe('bot jobs reaching a participant', () => {
	it('replace the list that is shown', () => {
		const { calls, deliver } = setup();
		const jobs = [ { id: jobId, type: 'recorder', label: 'Acme Recorder', state: 'running', sessionId: 's' } ];

		deliver('botJobs', { sessionId: 's', jobs });
		deliver('botJobs', { sessionId: 's' });

		expect(calls()).toEqual([ botJobsActions.setJobs(jobs as never), botJobsActions.setJobs([]) ]);
	});

	it('tell a moderator when one has failed, by its name and nothing else', () => {
		const { calls, deliver } = setup();

		deliver('botJobFailed', { jobId, label: 'Acme Recorder', reason: 'disk full on rec-7.internal' });

		const [ action ] = calls();

		expect(action.type).toBe(notificationsActions.enqueueNotification.type);
		expect(action.payload.message).toBe('Acme Recorder has stopped unexpectedly');
		expect(JSON.stringify(action.payload)).not.toContain('disk full');
	});
});

describe('the monitoring samples of a bot', () => {
	it('are marked as the samples of a bot, with its kind and its bot id', () => {
		const { mediaService, deliver } = setup({ botType: 'recorder', botId: jobId }, { headless: true });

		deliver('roomReady', roomReady);

		expect(mediaService.setMonitorAttachments).toHaveBeenCalledWith({ actualSessionId: 's', displayName: 'Acme Recorder', headless: true, botType: 'recorder', botId: jobId });
	});

	it('carry no such marks for a participant', () => {
		const { mediaService, deliver } = setup();

		deliver('roomReady', roomReady);

		expect(mediaService.setMonitorAttachments).toHaveBeenCalledWith({ actualSessionId: 's', displayName: 'Acme Recorder' });
	});
});
