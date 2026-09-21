import { describe, expect, it, vi } from 'vitest';

vi.mock('./edumeetConfig', () => ({ default: { serverHostname: 'rooms.example.edu', productionPort: 443, developmentPort: 8443 } }));
vi.stubGlobal('window', { location: { hostname: 'meet.example.edu' } });

import { BOT_RETRY_INTERVAL_MS, BOT_RETRY_WINDOW_MS, asBotJobType, asBotStatus, botMenu, botRetryPlan, disclosedJobs, disclosedKinds, BotJobInfo } from './botJobs';
import { asBotRejection, botJobIdFromUrl } from './headless';
import { getSignalingUrl } from './signalingHelpers';

const jobId = '5b2f1c1e-0000-4000-8000-000000000000';
const job = (state: BotJobInfo['state'], type: BotJobInfo['type'] = 'recorder'): BotJobInfo => ({ id: `${type}-${state}`, type, label: 'Acme', state, sessionId: 's' });

describe('bot job helpers', () => {
	it('knows the kinds of job and the states a bot may report, and nothing else', () => {
		expect(asBotJobType('streamer')).toBe('streamer');
		expect(asBotJobType('dancer')).toBeUndefined();
		expect(asBotStatus('finished')).toBe('finished');
		expect(asBotStatus('starting')).toBeUndefined();
		expect(asBotRejection('jobNotActive')).toBe('jobNotActive');
	});

	it('discloses a job to the room only while it captures or is expected back', () => {
		const jobs = [ job('starting'), job('joined'), job('running'), job('interrupted', 'streamer'), job('stopping') ];

		expect(disclosedJobs(jobs).map((j) => j.state)).toEqual([ 'running', 'interrupted' ]);
	});

	it('retries only a job page refused because the room is not open, and only for the window', () => {
		expect(botRetryPlan({ reason: 'roomNotOpen', jobId, now: 1_000 })).toEqual({ retry: true, firstRefusedAt: 1_000 });
		expect(botRetryPlan({ reason: 'roomNotOpen', now: 1_000 })).toEqual({ retry: false });
		expect(botRetryPlan({ reason: 'botTokenRejected', jobId, now: 1_000 })).toEqual({ retry: false });

		const lastInWindow = BOT_RETRY_WINDOW_MS - BOT_RETRY_INTERVAL_MS;

		expect(botRetryPlan({ reason: 'roomNotOpen', jobId, firstRefusedAt: 0, now: lastInWindow }).retry).toBe(true);
		expect(botRetryPlan({ reason: 'roomNotOpen', jobId, firstRefusedAt: 0, now: lastInWindow + 1 }).retry).toBe(false);
	});
});

describe('the job id of a bot page', () => {
	it('is read from the url only when it looks like one', () => {
		expect(botJobIdFromUrl(`https://meet.example.org/r?headless=1&jobId=${jobId}`)).toBe(jobId);
		expect(botJobIdFromUrl('https://meet.example.org/r?headless=1&jobId=../../etc')).toBeUndefined();
		expect(botJobIdFromUrl('https://meet.example.org/r?headless=1')).toBeUndefined();
		expect(botJobIdFromUrl(undefined)).toBeUndefined();
	});

	it('goes to the room server only from a headless page', () => {
		expect(getSignalingUrl('p', 'r', 'k', undefined, undefined, true, 'recorder', undefined, jobId)).toContain(`&jobId=${jobId}`);
		expect(getSignalingUrl('p', 'r', 'k', undefined, undefined, false, 'recorder', undefined, jobId)).not.toContain('jobId');
	});
});

describe('what the top bar shows of the jobs', () => {
	it('is one entry per kind, in a fixed order, running as soon as one of the kind runs', () => {
		const jobs = [ job('interrupted', 'transcriber'), job('running', 'streamer'), job('interrupted', 'recorder'), job('running', 'recorder'), job('starting', 'recorder') ];

		expect(disclosedKinds(jobs)).toEqual([
			{ type: 'recorder', running: true, label: 'Acme' },
			{ type: 'streamer', running: true, label: 'Acme' },
			{ type: 'transcriber', running: false, label: 'Acme' },
		]);
	});

	it('is nothing while no job captures', () => {
		expect(disclosedKinds([])).toEqual([]);
		expect(disclosedKinds([ job('starting'), job('joined'), job('stopping') ])).toEqual([]);
	});
});

describe('what the bot menu offers a moderator', () => {
	const bots = [ { id: 'job-bot' }, { id: 'stuck-bot' }, { id: 'manual-bot' } ];
	const jobs: BotJobInfo[] = [
		{ ...job('running'), id: 'j-running', peerId: 'job-bot' },
		{ ...job('stopping'), id: 'j-stopping', peerId: 'stuck-bot' },
		{ ...job('starting'), id: 'j-starting' },
		{ ...job('stopping'), id: 'j-gone', peerId: 'already-left' },
	];

	it('lists as plain bots only the ones that belong to no job', () => {
		expect(botMenu(bots, jobs).plainBots).toEqual([ { id: 'manual-bot' } ]);
		expect(botMenu(bots, []).plainBots).toEqual(bots);
	});

	it('stops through the provider every job that is not stopping already, arrived or not', () => {
		expect(botMenu(bots, jobs).stoppableJobIds).toEqual([ 'j-running', 'j-starting' ]);
	});

	it('kicks the plain bots and the bots that did not leave after a stop, and nobody who already left', () => {
		expect(botMenu(bots, jobs).kickablePeerIds).toEqual([ 'manual-bot', 'stuck-bot' ]);
	});

	it('never kicks the bot of a job that can still be stopped properly', () => {
		expect(botMenu(bots, jobs).kickablePeerIds).not.toContain('job-bot');
	});
});
