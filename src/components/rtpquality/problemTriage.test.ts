import { describe, expect, test } from 'vitest';
import type { ClientMonitor } from '@observertc/client-monitor-js';
import { POOR_SENDING_SCORE, ownProblem, ownSideQuality, peerProblem } from './problemTriage';

type FakeTrack = {
	direction: 'inbound' | 'outbound';
	kind?: 'audio' | 'video';
	readyState?: MediaStreamTrack['readyState'];
	paused?: boolean;
	score?: number;
	reasons?: Record<string, number>;
	issues?: string[];
};

/** Just enough of a ClientMonitor for the triage functions to read. */
const fakeMonitor = ({ issues = [], tracks = {}, stability = [] }: { issues?: string[]; tracks?: Record<string, FakeTrack>; stability?: number[] } = {}) => {
	const trackMonitors = new Map(Object.entries(tracks).map(([ id, track ]) => {
		const registry = new Map((track.issues ?? []).map((type) => [ `${type}-track-${id}`, { type } ]));

		return [ id, {
			direction: track.direction,
			kind: track.kind ?? 'video',
			readyState: track.readyState ?? 'live',
			paused: track.paused ?? false,
			calculatedScore: { weight: 1, value: track.score, reasons: track.reasons },
			issues: { keys: () => registry.keys(), get: (key: string) => registry.get(key) },
			registry,
		} ];
	}));

	// A track issue lives in the track registry and is mirrored in the client registry
	// under the same key, as the library does it.
	const clientIssues = new Map<string, { type: string }>(issues.map((type) => [ `client-${type}`, { type } ]));

	for (const trackMonitor of trackMonitors.values()) {
		for (const [ key, issue ] of trackMonitor.registry) clientIssues.set(key, issue);
	}

	return {
		getActiveIssuesByType: (type: string) => Array.from(clientIssues.values()).filter((issue) => issue.type === type),
		activeIssues: { keys: () => clientIssues.keys(), get: (key: string) => clientIssues.get(key) },
		peerConnections: stability.map((value) => ({ calculatedStabilityScore: { weight: 1, value } })),
		tracks: Array.from(trackMonitors.values()),
		getInboundTrackMonitor: (id: string) => trackMonitors.get(id),
	} as unknown as ClientMonitor;
};

describe('ownProblem', () => {
	test('a healthy client shows nothing', () => {
		expect(ownProblem(fakeMonitor({ tracks: { mic: { direction: 'outbound', score: 5 } } }))).toBeUndefined();
	});

	test('names an actionable issue on the user\'s own side', () => {
		const problem = ownProblem(fakeMonitor({ issues: [ 'uplink-congestion' ] }));

		expect(problem?.kind).toBe('uplink');
		expect(problem?.issues.map((issue) => issue.key)).toEqual([ 'uplink-congestion' ]);
	});

	test('when several are active, names them in priority order', () => {
		expect(ownProblem(fakeMonitor({ issues: [ 'transport-loss-sustained', 'cpulimitation' ] }))?.kind).toBe('cpu');
		expect(ownProblem(fakeMonitor({ issues: [ 'downlink-congestion', 'uplink-congestion' ] }))?.kind).toBe('uplink');
	});

	test('ignores everything about other people\'s media, however bad', () => {
		const monitor = fakeMonitor({
			issues: [ 'pixelated-video', 'dry-inbound-track', 'av-desync', 'transport-delay-degraded' ],
			tracks: {
				theirVideo: { direction: 'inbound', score: 0.5, issues: [ 'pixelated-video' ] },
				theirAudio: { direction: 'inbound', score: 1, issues: [ 'audio-jitter-buffer-stress' ] },
				mic: { direction: 'outbound', score: 5 },
			},
		});

		expect(ownProblem(monitor)).toBeUndefined();
	});

	test('reports poor sending with the reasons behind it', () => {
		const problem = ownProblem(fakeMonitor({
			tracks: {
				cam: { direction: 'outbound', score: 2.1, reasons: { 'encoder-bottleneck': 1.9 } },
				mic: { direction: 'outbound', score: 5 },
			},
		}));

		expect(problem?.kind).toBe('sending');
		expect(problem?.score).toBe(2.1);
		expect(problem?.reasons.map((reason) => reason.key)).toEqual([ 'encoder-bottleneck' ]);
	});

	test('a mediocre sending score is not a problem', () => {
		expect(ownProblem(fakeMonitor({ tracks: { cam: { direction: 'outbound', score: POOR_SENDING_SCORE + 0.1 } } }))).toBeUndefined();
	});

	test('a paused or ended sender does not count', () => {
		expect(ownProblem(fakeMonitor({ tracks: {
			cam: { direction: 'outbound', score: 0, paused: true },
			old: { direction: 'outbound', score: 0, readyState: 'ended' },
		} }))).toBeUndefined();
	});

	test('an actionable issue wins the label, poor sending still supplies the reasons', () => {
		const problem = ownProblem(fakeMonitor({
			issues: [ 'cpulimitation' ],
			tracks: { cam: { direction: 'outbound', score: 1, reasons: { 'video-capture-bottleneck': 2 } } },
		}));

		expect(problem?.kind).toBe('cpu');
		expect(problem?.reasons.map((reason) => reason.key)).toEqual([ 'video-capture-bottleneck' ]);
	});
});

describe('peerProblem', () => {
	test('nothing while media flows, however degraded', () => {
		const monitor = fakeMonitor({ tracks: {
			v: { direction: 'inbound', score: 1, issues: [ 'pixelated-video', 'av-desync' ] },
			a: { direction: 'inbound', score: 1, issues: [ 'audio-jitter-buffer-stress' ] },
		} });

		expect(peerProblem(monitor, { audio: 'a', video: 'v' })).toBeUndefined();
	});

	test('names the track from which nothing arrives', () => {
		const monitor = fakeMonitor({ tracks: {
			v: { direction: 'inbound', issues: [ 'video-flow-disrupted' ] },
			a: { direction: 'inbound' },
		} });

		expect(peerProblem(monitor, { audio: 'a', video: 'v' })).toMatchObject({ audio: false, video: true });
		expect(peerProblem(monitor, { audio: 'a' })).toBeUndefined();
	});

	test('both tracks dry', () => {
		const monitor = fakeMonitor({ tracks: {
			v: { direction: 'inbound', issues: [ 'dry-inbound-track' ] },
			a: { direction: 'inbound', issues: [ 'dry-inbound-track' ] },
		} });

		expect(peerProblem(monitor, { audio: 'a', video: 'v' })).toMatchObject({ audio: true, video: true });
	});

	test('unknown tracks are not a problem', () => {
		expect(peerProblem(fakeMonitor(), { audio: 'missing', video: 'missing' })).toBeUndefined();
		expect(peerProblem(fakeMonitor(), {})).toBeUndefined();
	});
});

describe('ownSideQuality', () => {
	test('combines transport stability and own sending with the library formula', () => {
		const quality = ownSideQuality(fakeMonitor({
			stability: [ 5 ],
			tracks: { mic: { direction: 'outbound', kind: 'audio', score: 3, reasons: { 'silent-audio-source': 2 } } },
		}));

		// dimensions 5 and 3: 5 - sqrt((0 + 4) / 2) = 3.59
		expect(quality.score).toBe(3.59);
		expect(quality.reasons.map((reason) => reason.key)).toEqual([ 'silent-audio-source' ]);
	});

	test('media of other participants moves neither the score nor the issue list', () => {
		const quality = ownSideQuality(fakeMonitor({
			stability: [ 5 ],
			issues: [ 'cpulimitation' ],
			tracks: {
				mic: { direction: 'outbound', kind: 'audio', score: 5 },
				theirVideo: { direction: 'inbound', kind: 'video', score: 0, reasons: { 'blocky-video': 3 }, issues: [ 'pixelated-video', 'dry-inbound-track' ] },
			},
		}));

		expect(quality.score).toBe(5);
		expect(quality.reasons).toEqual([]);
		expect(quality.issues.map((issue) => issue.key)).toEqual([ 'cpulimitation' ]);
	});

	test('undefined without anything scored yet', () => {
		expect(ownSideQuality(fakeMonitor()).score).toBeUndefined();
	});
});
