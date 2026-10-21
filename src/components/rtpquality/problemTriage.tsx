import type { ClientMonitor, OutboundTrackMonitor } from '@observertc/client-monitor-js';
import { MAX_SCORE, QualityIssue, ScoreReason, toQualityIssues, toScoreReasons } from './qualityScore';

export type OwnProblemKind = 'loopback' | 'uplink' | 'downlink' | 'cpu' | 'capture' | 'loss' | 'sending';

export type OwnProblem = {
	kind: OwnProblemKind;
	// The active issues that raised it, with their explanations.
	issues: QualityIssue[];
	// Why the user's own sending scores poorly, when that is (also) the case.
	reasons: ScoreReason[];
	score?: number;
};

/**
 * Issue types the local user can do something about, in the order one of them
 * is named when several are active. Everything the library reports about
 * inbound tracks is deliberately absent: that media is someone else's to fix,
 * so it belongs on that person's list entry and tile, not in this user's bar.
 * A raised round trip time is absent too; a stable slow path still works and
 * gives the user nothing to act on. A loopback microphone comes first: it is
 * certain from the device name alone, and whatever else is wrong, nobody hears
 * this user's voice until it is fixed. A camera delivering fewer frames than
 * asked (`video-capture-bottleneck`) is absent: a webcam in dim light drops to
 * about 16 fps while working fine, which is no reason to say it stopped.
 *
 * `cpulimitation` stands for the browser's own verdict, not the library's
 * detector of that name: the detector adds up the encode time of every
 * simulcast layer, which crosses its threshold on a healthy machine sending
 * 720p. The browser reports `cpu` only when it is actually cutting resolution
 * or frame rate for lack of CPU.
 */
export const OWN_ISSUE_KINDS: ReadonlyArray<readonly [ string, OwnProblemKind ]> = [
	[ 'loopback-audio-input', 'loopback' ],
	[ 'uplink-congestion', 'uplink' ],
	[ 'downlink-congestion', 'downlink' ],
	[ 'cpulimitation', 'cpu' ],
	[ 'capture-source-lost', 'capture' ],
	[ 'dry-outbound-track', 'capture' ],
	[ 'transport-loss-sustained', 'loss' ],
];

/** At or below this, what others receive from this user is bad enough to say so. */
export const POOR_SENDING_SCORE = 2.5;

type ScoredSender = { score: number; reasons: ScoreReason[] };

const isOutbound = (track: ClientMonitor['tracks'][number]): track is OutboundTrackMonitor =>
	track.direction === 'outbound';

const sending = (track: OutboundTrackMonitor): boolean => track.readyState === 'live' && !track.paused;

const encoderLimitedByCpu = (monitor: ClientMonitor): boolean =>
	monitor.tracks.filter(isOutbound).some((track) =>
		track.kind === 'video' &&
		sending(track) &&
		track.getOutboundRtps().some((rtp) => rtp.qualityLimitationReason === 'cpu'));

const ownIssueActive = (monitor: ClientMonitor, type: string): boolean => {
	if (type === 'cpulimitation') return encoderLimitedByCpu(monitor);

	return monitor.getActiveIssuesByType(type).length > 0;
};

/**
 * The user's own live, unpaused video track in the worst shape, if any is scored.
 *
 * Audio is left out: the library scores an outbound audio track only on
 * `dry-outbound-track`, which is named on its own above, and on
 * `silent-audio-source`, which a headset muted at the device raises after a
 * minute. That mute is deliberate as often as not, so it stays in the quality
 * window.
 */
const worstSender = (monitor: ClientMonitor): ScoredSender | undefined => {
	let worst: ScoredSender | undefined;

	for (const sender of monitor.tracks.filter(isOutbound)) {
		if (sender.kind !== 'video' || !sending(sender)) continue;

		const score = sender.calculatedScore?.value;

		if (score === undefined || Number.isNaN(score)) continue;
		if (!worst || score < worst.score) worst = { score, reasons: toScoreReasons(sender.calculatedScore.reasons) };
	}

	return worst;
};

/**
 * What, if anything, the top bar should say about this user's own side of the
 * call. Undefined means nothing is shown, whatever other participants' media
 * looks like.
 */
export const ownProblem = (monitor: ClientMonitor): OwnProblem | undefined => {
	const active = OWN_ISSUE_KINDS.filter(([ type ]) => ownIssueActive(monitor, type));
	const sender = worstSender(monitor);
	const poorSending = sender !== undefined && sender.score <= POOR_SENDING_SCORE;

	if (active.length === 0 && !poorSending) return undefined;

	return {
		kind: active[0]?.[1] ?? 'sending',
		issues: toQualityIssues(active.map(([ type ]) => type)),
		reasons: poorSending ? sender.reasons : [],
		score: poorSending ? sender.score : undefined,
	};
};

/**
 * The one per-peer fact worth a passive mark next to a name: nothing usable is
 * arriving from that person. Degraded but flowing media (pixelation, jitter,
 * desync) is not that, and stays in the quality window.
 */
export const PEER_ISSUE_TYPES: readonly string[] = [ 'dry-inbound-track', 'video-flow-disrupted' ];

export type PeerTrackIds = { audio?: string; video?: string };

export type PeerProblem = {
	audio: boolean;
	video: boolean;
	issues: QualityIssue[];
};

const failingTypes = (monitor: ClientMonitor, trackId?: string): string[] => {
	const trackMonitor = trackId ? monitor.getInboundTrackMonitor(trackId) : undefined;

	if (!trackMonitor) return [];

	const active = new Set<string>();

	for (const key of Array.from(trackMonitor.issues.keys())) {
		const type = trackMonitor.issues.get(key)?.type;

		if (type && PEER_ISSUE_TYPES.includes(type)) active.add(type);
	}

	return Array.from(active);
};

export const peerProblem = (monitor: ClientMonitor, tracks: PeerTrackIds): PeerProblem | undefined => {
	const audio = failingTypes(monitor, tracks.audio);
	const video = failingTypes(monitor, tracks.video);

	if (audio.length === 0 && video.length === 0) return undefined;

	return {
		audio: audio.length > 0,
		video: video.length > 0,
		issues: toQualityIssues([ ...audio, ...video ]),
	};
};

type CalculatedScore = OutboundTrackMonitor['calculatedScore'];

export type OwnSideQuality = {
	score?: number;
	reasons: ScoreReason[];
	issues: QualityIssue[];
};

/** The library's dimension score: a weighted mean of the scores that have a value. */
const dimensionScore = (scores: CalculatedScore[]): number | undefined => {
	let total = 0;
	let weight = 0;

	for (const score of scores) {
		if (score.value === undefined) continue;

		total += score.value * score.weight;
		weight += score.weight;
	}

	return weight > 0 ? total / weight : undefined;
};

/** The library's client score over dimensions: penalties combined as a root mean square. */
const combineDimensions = (dimensions: (number | undefined)[]): number | undefined => {
	const known = dimensions.filter((value): value is number => value !== undefined);

	if (known.length === 0) return undefined;

	const meanSquaredPenalty = known.reduce((sum, value) => sum + ((MAX_SCORE - value) ** 2), 0) / known.length;
	const score = Math.max(0, Math.min(MAX_SCORE, MAX_SCORE - Math.sqrt(meanSquaredPenalty)));

	return Math.round(score * 100) / 100;
};

const mergeReasons = (into: Record<string, number>, reasons?: Record<string, number>): void => {
	for (const [ key, penalty ] of Object.entries(reasons ?? {})) {
		into[key] = Math.max(into[key] ?? 0, penalty);
	}
};

/**
 * What the CONNECTION panel shows: the same formula the library uses for its
 * client score, but over this user's own dimensions only, transport stability
 * and outbound audio and video. The library's own client score also averages
 * in every inbound track, so it drops when someone else's camera struggles,
 * and under a heading that says CONNECTION that reads as this user's fault.
 * Inbound issues are left out for the same reason; they show on the tile of
 * the peer they belong to.
 */
export const ownSideQuality = (monitor: ClientMonitor): OwnSideQuality => {
	const reasons: Record<string, number> = {};
	const stability = monitor.peerConnections.map((peerConnection) => peerConnection.calculatedStabilityScore);
	const senders = monitor.tracks.filter(isOutbound);
	const dimensions = [
		stability,
		senders.filter((sender) => sender.kind === 'audio').map((sender) => sender.calculatedScore),
		senders.filter((sender) => sender.kind === 'video').map((sender) => sender.calculatedScore),
	];

	for (const dimension of dimensions) {
		for (const score of dimension) if (score.value !== undefined) mergeReasons(reasons, score.reasons);
	}

	const inboundIssueKeys = new Set<string>();

	for (const track of monitor.tracks) {
		if (track.direction === 'inbound') for (const key of Array.from(track.issues.keys())) inboundIssueKeys.add(key);
	}

	const issueTypes = new Set<string>();

	for (const key of Array.from(monitor.activeIssues.keys())) {
		const type = monitor.activeIssues.get(key)?.type;

		if (type && !inboundIssueKeys.has(key)) issueTypes.add(type);
	}

	return {
		score: combineDimensions(dimensions.map(dimensionScore)),
		reasons: toScoreReasons(reasons),
		issues: toQualityIssues(issueTypes),
	};
};
