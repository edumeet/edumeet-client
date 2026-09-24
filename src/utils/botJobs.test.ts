import { describe, expect, it, vi } from 'vitest';

vi.mock('./edumeetConfig', () => ({ default: { serverHostname: 'rooms.example.edu', productionPort: 443, developmentPort: 8443 } }));
vi.stubGlobal('window', { location: { hostname: 'meet.example.edu' } });

import { BOT_RETRY_INTERVAL_MS, BOT_RETRY_WINDOW_MS, kickRowJobIds, offeredKinds, providerBotPresent, asBotJobType, audioOnlyCapabilities, transcriberPage, asBotStatus, botMenu, botRetryPlan, disclosedJobs, disclosedKinds, BotJobInfo } from './botJobs';
import { asBotRejection, botIdFromUrl } from './headless';
import { getSignalingUrl } from './signalingHelpers';

const botId = '5b2f1c1e-0000-4000-8000-000000000000';
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
		expect(botRetryPlan({ reason: 'roomNotOpen', botId, now: 1_000 })).toEqual({ retry: true, firstRefusedAt: 1_000 });
		expect(botRetryPlan({ reason: 'roomNotOpen', now: 1_000 })).toEqual({ retry: false });
		expect(botRetryPlan({ reason: 'botTokenRejected', botId, now: 1_000 })).toEqual({ retry: false });

		const lastInWindow = BOT_RETRY_WINDOW_MS - BOT_RETRY_INTERVAL_MS;

		expect(botRetryPlan({ reason: 'roomNotOpen', botId, firstRefusedAt: 0, now: lastInWindow }).retry).toBe(true);
		expect(botRetryPlan({ reason: 'roomNotOpen', botId, firstRefusedAt: 0, now: lastInWindow + 1 }).retry).toBe(false);
	});
});

describe('the bot id of a bot page', () => {
	it('is read from the url only when it looks like one', () => {
		expect(botIdFromUrl(`https://meet.example.org/r?headless=1&botId=${botId}`)).toBe(botId);
		expect(botIdFromUrl('https://meet.example.org/r?headless=1&botId=../../etc')).toBeUndefined();
		expect(botIdFromUrl(`https://meet.example.org/r?headless=1&jobId=${botId}`)).toBeUndefined();
		expect(botIdFromUrl(undefined)).toBeUndefined();
	});

	it('goes to the room server only from a headless page', () => {
		expect(getSignalingUrl('p', 'r', 'k', undefined, undefined, true, undefined, undefined, botId)).toContain(`&botId=${botId}`);
		expect(getSignalingUrl('p', 'r', 'k', undefined, undefined, false, undefined, undefined, botId)).not.toContain('botId');
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

	it('names a bot once, however many of its jobs are stopping', () => {
		const shared: BotJobInfo[] = [ { ...job('stopping'), id: 'a', peerId: 'stuck-bot' }, { ...job('stopping', 'transcriber'), id: 'b', peerId: 'stuck-bot' } ];

		expect(botMenu(bots, shared).kickablePeerIds).toEqual([ 'job-bot', 'manual-bot', 'stuck-bot' ]);
	});
});

describe('what a transcriber declares it can receive', () => {
	it('is audio only, codecs and header extensions alike, with the rest of the capabilities kept', () => {
		const declared = audioOnlyCapabilities({
			codecs: [ { kind: 'audio', mimeType: 'audio/opus' }, { kind: 'video', mimeType: 'video/VP8' }, { kind: 'video', mimeType: 'video/rtx' } ],
			headerExtensions: [ { kind: 'audio', uri: 'urn:ietf:params:rtp-hdrext:ssrc-audio-level' }, { kind: 'video', uri: 'urn:3gpp:video-orientation' } ],
			fecMechanisms: [],
		});

		expect(declared.codecs).toEqual([ { kind: 'audio', mimeType: 'audio/opus' } ]);
		expect(declared.headerExtensions).toEqual([ { kind: 'audio', uri: 'urn:ietf:params:rtp-hdrext:ssrc-audio-level' } ]);
		expect(declared.fecMechanisms).toEqual([]);
		expect(audioOnlyCapabilities({})).toEqual({ codecs: [], headerExtensions: [] });
	});
});

describe('which page gives up video', () => {
	it('is a headless transcriber page and nothing else', () => {
		expect(transcriberPage('https://meet.example.org/r?headless=1&botType=transcriber')).toBe(true);
		expect(transcriberPage('https://meet.example.org/r?headless=true&botType=transcriber&jobId=x')).toBe(true);
		// a participant with a stray parameter in a shared link keeps their video
		expect(transcriberPage('https://meet.example.org/r?botType=transcriber')).toBe(false);
		expect(transcriberPage('https://meet.example.org/r?headless=0&botType=transcriber')).toBe(false);
		// the other kinds of bot need video
		expect(transcriberPage('https://meet.example.org/r?headless=1&botType=recorder')).toBe(false);
		expect(transcriberPage('https://meet.example.org/r?headless=1')).toBe(false);
		expect(transcriberPage(undefined)).toBe(false);
	});
});

describe('a bot that runs several jobs, in the bot menu', () => {
	const shared: BotJobInfo[] = [
		{ ...job('running'), id: 'rec', peerId: 'acme-bot', providerId: 9 },
		{ ...job('running', 'streamer'), id: 'live', peerId: 'acme-bot', providerId: 9 },
		{ ...job('running', 'transcriber'), id: 'text', peerId: 'other-bot', providerId: 4 },
	];

	it('offers Kick once per bot to a moderator who cannot stop jobs, on its first row', () => {
		expect([ ...kickRowJobIds(shared, false) ]).toEqual([ 'rec', 'text' ]);
	});

	it('offers no Kick for jobs that can be stopped, and one per bot that is leaving', () => {
		expect([ ...kickRowJobIds(shared, true) ]).toEqual([]);

		const leaving = shared.map((j) => (j.peerId === 'acme-bot' ? { ...j, state: 'stopping' as const } : j));

		expect([ ...kickRowJobIds(leaving, true) ]).toEqual([ 'rec' ]);
	});

	it('never offers Kick for a job whose bot has not arrived', () => {
		expect([ ...kickRowJobIds([ { ...job('starting'), id: 'waiting' } ], false) ]).toEqual([]);
	});
});

describe('whether a provider\'s bot is already in the session', () => {
	it('is so once it has joined, and while it runs', () => {
		expect(providerBotPresent([ { ...job('joined'), providerId: 9 } ], 9)).toBe(true);
		expect(providerBotPresent([ { ...job('running'), providerId: 9 } ], 9)).toBe(true);
	});

	it('is not so while it is still on its way, away, or leaving, nor for a provider with no job here', () => {
		for (const state of [ 'starting', 'interrupted', 'stopping' ] as const) expect(providerBotPresent([ { ...job(state), providerId: 9 } ], 9)).toBe(false);
		expect(providerBotPresent([ { ...job('running'), providerId: 9 } ], 1)).toBe(false);
	});
});

describe('the kinds a moderator is offered to start', () => {
	const acme = { id: 9, label: 'Acme', jobTypes: [ 'recorder', 'streamer' ] as BotJobInfo['type'][] };
	const scribe = { id: 4, label: 'Scribe', jobTypes: [ 'transcriber' ] as BotJobInfo['type'][] };

	it('are every kind some provider offers, in a fixed order', () => {
		expect(offeredKinds([ scribe, acme ], [])).toEqual([ 'recorder', 'streamer', 'transcriber' ]);
		expect(offeredKinds([], [])).toEqual([]);
	});

	it('leave out a kind that already runs in the session, whoever provides it', () => {
		expect(offeredKinds([ acme, scribe ], [ job('running', 'streamer'), job('starting', 'transcriber') ])).toEqual([ 'recorder' ]);
	});

	it('are none from a provider whose kinds arrive in a shape from before, rather than an error', () => {
		const older = { id: 7, label: 'Old', jobType: 'recorder' } as never;

		expect(offeredKinds([ older ], [])).toEqual([]);
		expect(offeredKinds([ older, scribe ], [])).toEqual([ 'transcriber' ]);
	});

	it('offer a kind again once its job is stopping, as the room server takes it then', () => {
		expect(offeredKinds([ acme ], [ job('stopping', 'recorder') ])).toEqual([ 'recorder', 'streamer' ]);
	});
});
