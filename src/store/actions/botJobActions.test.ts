import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, askForMediaOnJoin: true, simulcast: true, simulcastSharing: true, browserWarnings: [] } }));
vi.mock('../../utils/deviceInfo', () => ({ deviceInfo: () => ({ name: 'test', version: '1', platform: 'test' }) }));
vi.mock('../../services/mediaService', () => ({}));
vi.mock('../store', () => ({}));
vi.mock('../../components/translated/translatedComponents', () => ({
	botJobStartFailedLabel: () => 'The bot could not be started',
	botJobStopFailedLabel: () => 'The bot could not be stopped',
}));

import { sendBotStatus, startBotJob, stopBotJob } from './botJobActions';
import { notificationsActions } from '../slices/notificationsSlice';

const jobId = '5b2f1c1e-0000-4000-8000-000000000000';

type Thunk = ReturnType<typeof sendBotStatus> | ReturnType<typeof startBotJob>;

const run = (thunk: Thunk, state: Record<string, unknown>, signalingService: Record<string, unknown>) => {
	const dispatch = vi.fn();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result = (thunk as any)(dispatch, () => state, { signalingService });

	return { dispatch, result };
};

const botPage = (over: { room?: Record<string, unknown>, me?: Record<string, unknown> } = {}) => ({
	room: { headless: true, state: 'joined', ...over.room },
	me: { botId: jobId, ...over.me },
});

describe('what window.edumeetBot.status() sends', () => {
	it('the three states a bot may report, and says that it sent them', () => {
		for (const state of [ 'running', 'finished' ]) {
			const notify = vi.fn();

			expect(run(sendBotStatus(state), botPage(), { notify }).result).toBe(true);
			expect(notify).toHaveBeenCalledWith('botStatus', { state });
		}
	});

	it('a reason only with a failure, as text, and no longer than the room server takes', () => {
		const notify = vi.fn();

		run(sendBotStatus('failed', 'x'.repeat(500)), botPage(), { notify });
		run(sendBotStatus('failed', 42), botPage(), { notify });
		run(sendBotStatus('failed', ''), botPage(), { notify });
		run(sendBotStatus('running', 'not a failure'), botPage(), { notify });

		expect(notify.mock.calls.map(([ , data ]) => data)).toEqual([
			{ state: 'failed', reason: 'x'.repeat(200) },
			{ state: 'failed' },
			{ state: 'failed' },
			{ state: 'running' },
		]);
	});

	it('the kind a finished or failed is about, and no kind with a heartbeat', () => {
		const notify = vi.fn();

		run(sendBotStatus('failed', 'service down', 'transcriber'), botPage(), { notify });
		run(sendBotStatus('finished', undefined, 'streamer'), botPage(), { notify });
		run(sendBotStatus('running', undefined, 'recorder'), botPage(), { notify });

		expect(notify.mock.calls.map(([ , data ]) => data)).toEqual([
			{ state: 'failed', reason: 'service down', type: 'transcriber' },
			{ state: 'finished', type: 'streamer' },
			{ state: 'running' },
		]);
	});

	it('nothing when the kind is no kind, rather than a report about the whole bot', () => {
		const notify = vi.fn();

		expect(run(sendBotStatus('failed', 'x', 'dancer'), botPage(), { notify }).result).toBe(false);
		expect(run(sendBotStatus('finished', undefined, 42), botPage(), { notify }).result).toBe(false);
		expect(notify).not.toHaveBeenCalled();
	});

	it('nothing for a state that does not exist', () => {
		const notify = vi.fn();

		for (const state of [ 'starting', 'stopped', '', undefined, 1 ]) expect(run(sendBotStatus(state), botPage(), { notify }).result).toBe(false);
		expect(notify).not.toHaveBeenCalled();
	});

	it('nothing from a page that is no job page, or is not in the room', () => {
		const notify = vi.fn();

		expect(run(sendBotStatus('running'), botPage({ room: { headless: false } }), { notify }).result).toBe(false);
		expect(run(sendBotStatus('running'), botPage({ me: { botId: undefined } }), { notify }).result).toBe(false);

		for (const state of [ 'new', 'lobby', 'left' ]) expect(run(sendBotStatus('running'), botPage({ room: { state } }), { notify }).result).toBe(false);

		expect(notify).not.toHaveBeenCalled();
	});
});

describe('starting and stopping a job from the room', () => {
	it('asks the room server with the kind and the provider, or with the job', async () => {
		const sendRequest = vi.fn(async () => ({ jobId }));

		await run(startBotJob('recorder', 7), {}, { sendRequest }).result;
		await run(startBotJob('streamer'), {}, { sendRequest }).result;
		await run(stopBotJob(jobId), {}, { sendRequest }).result;

		expect(sendRequest.mock.calls).toEqual([
			[ 'moderator:startBotJob', { type: 'recorder', providerId: 7 } ],
			[ 'moderator:startBotJob', { type: 'streamer', providerId: undefined } ],
			[ 'moderator:stopBotJob', { jobId } ],
		]);
	});

	it('tells the moderator when the room server refuses, and does not throw', async () => {
		const sendRequest = vi.fn(async () => { throw new Error('Server error'); });
		const started = run(startBotJob('recorder'), {}, { sendRequest });
		const stopped = run(stopBotJob(jobId), {}, { sendRequest });

		await expect(started.result).resolves.toBeUndefined();
		await expect(stopped.result).resolves.toBeUndefined();

		const messages = [ started, stopped ].map(({ dispatch }) => dispatch.mock.calls[0][0]);

		expect(messages.map((action) => action.type)).toEqual([ notificationsActions.enqueueNotification.type, notificationsActions.enqueueNotification.type ]);
		expect(messages.map((action) => action.payload.message)).toEqual([ 'The bot could not be started', 'The bot could not be stopped' ]);
		expect(JSON.stringify(messages)).not.toContain('Server error');
	});
});
