import type { ClientMonitor } from '@observertc/client-monitor-js';
import { QualityIssue, toQualityIssues } from '../rtpquality/qualityScore';

export type ConnectivityCheckId =
	| 'candidates'
	| 'stun'
	| 'icePath'
	| 'dtls'
	| 'outbound'
	| 'inbound';

/**
 * `ok` - verified working, `failed` - an active issue says it is broken,
 * `pending` - not established yet but nothing reported it as broken,
 * `skipped` - nothing to verify (inbound media while alone in the room).
 */
export type ConnectivityCheckStatus = 'ok' | 'failed' | 'pending' | 'skipped';

export type ConnectivityCheck = {
	id: ConnectivityCheckId;
	status: ConnectivityCheckStatus;
	// Short factual line, e.g. `turn-tcp, 42 ms` or `host 4 · srflx 1 · relay 2`.
	detail?: string;
	// The active issues that put this check into `failed`.
	issues: QualityIssue[];
};

export type ConnectivityReport = {
	checks: ConnectivityCheck[];
	// The first failing check in connection order - the most likely culprit.
	culprit?: ConnectivityCheckId;
};

/**
 * Which issue types mean "this step of connecting is broken".
 *
 * These are deliberately only the connectivity detectors of
 * `@observertc/client-monitor-js`. Quality problems (congestion, transport
 * delay or loss, CPU, decoder, A/V desync, pixelation) are NOT here: the call
 * works in those cases, it is just worse, and a dialog for them would be noise.
 *
 * The key order is the order media actually has to get through, which is what
 * makes the first failure the most useful thing to report.
 */
export const CHECK_ISSUE_TYPES: Record<ConnectivityCheckId, string[]> = {
	candidates: [ 'no-available-ice-candidate' ],
	stun: [ 'blocked-stun-requests' ],
	icePath: [
		'ice-establishment-failed',
		'ice-connection-failed',
		'ice-disconnected',
		'ice-transport-stalled',
		'unstable-ice-path',
	],
	dtls: [ 'dtls-handshake-failed', 'dtls-handshake-stalled' ],
	outbound: [ 'blocked-outbound-media-transport', 'rtp-sender-stalled', 'dry-outbound-track' ],
	inbound: [ 'blocked-inbound-media-transport', 'transport-demux-stalled', 'dry-inbound-track' ],
};

export const CHECK_ORDER: ConnectivityCheckId[] = [
	'candidates',
	'stun',
	'icePath',
	'dtls',
	'outbound',
	'inbound',
];

/**
 * These describe one track, the rest describe the connection. A single track
 * going dry while other media flows is a quality problem for that peer, not a
 * connectivity failure, so they only count while nothing is getting through in
 * that direction at all.
 */
const TRACK_LEVEL_ISSUE_TYPES = new Set([ 'dry-inbound-track', 'dry-outbound-track', 'rtp-sender-stalled' ]);

const activeIssuesOf = (
	monitor: ClientMonitor,
	id: ConnectivityCheckId,
	stalled: boolean,
): QualityIssue[] => {
	const types: string[] = [];

	for (const type of CHECK_ISSUE_TYPES[id]) {
		if (!stalled && TRACK_LEVEL_ISSUE_TYPES.has(type)) continue;
		if (monitor.getActiveIssuesByType(type).length > 0) types.push(type);
	}

	return toQualityIssues(types);
};

const candidateSummary = (monitor: ClientMonitor): { total: number, detail?: string } => {
	const counts = new Map<string, number>();
	let total = 0;

	for (const peerConnection of monitor.peerConnections) {
		for (const candidate of peerConnection.localIceCandidates) {
			const type = candidate.candidateType ?? 'unknown';

			counts.set(type, (counts.get(type) ?? 0) + 1);
			total += 1;
		}
	}

	if (total === 0) return { total };

	const detail = Array.from(counts.entries())
		.map(([ type, count ]) => `${type} ${count}`)
		.join(' · ');

	return { total, detail };
};

/** The network path actually in use, e.g. `turn-tcp, 42 ms`. */
const pathDetail = (monitor: ClientMonitor): string | undefined => {
	for (const peerConnection of monitor.peerConnections) {
		for (const pair of peerConnection.selectedIceCandidatePairs) {
			const parts: string[] = [ pair.pathKind ];
			const rtt = pair.currentRoundTripTime;

			if (rtt !== undefined) parts.push(`${Math.round(rtt * 1000)} ms`);

			return parts.join(', ');
		}
	}

	return undefined;
};

const anyStunAnswered = (monitor: ClientMonitor): boolean =>
	monitor.iceCandidatePairs.some((pair) => (pair.responsesReceived ?? 0) > 0);

const anyIceConnected = (monitor: ClientMonitor): boolean =>
	monitor.peerConnections.some((peerConnection) =>
		peerConnection.connectionState === 'connected' ||
		peerConnection.iceState === 'connected' ||
		peerConnection.iceState === 'completed');

const dtlsDetail = (monitor: ClientMonitor): string | undefined => {
	for (const transport of monitor.iceTransports) {
		if (transport.dtlsState) return transport.dtlsState;
	}

	return undefined;
};

const anyDtlsConnected = (monitor: ClientMonitor): boolean =>
	monitor.iceTransports.some((transport) => transport.dtlsState === 'connected');

const kbps = (bitrate: number): string => `${Math.round(bitrate / 1000)} kbps`;

/**
 * Turns the monitor's current state into a per-step pass/fail report, so the
 * user can see *where* connecting broke rather than only that it did.
 *
 * `expectInbound` is false when nobody else is in the room: there is then no
 * incoming media to wait for, and the inbound check would otherwise sit red for
 * something that is not a fault.
 */
export const buildConnectivityReport = (
	monitor: ClientMonitor,
	{ expectInbound }: { expectInbound: boolean },
): ConnectivityReport => {
	const candidates = candidateSummary(monitor);
	const iceConnected = anyIceConnected(monitor);
	const sending = monitor.sendingAudioBitrate + monitor.sendingVideoBitrate;
	const receiving = monitor.receivingAudioBitrate + monitor.receivingVideoBitrate;

	const statusOf = (issues: QualityIssue[], passed: boolean): ConnectivityCheckStatus => {
		if (issues.length > 0) return 'failed';
		if (passed) return 'ok';

		return 'pending';
	};

	const stalled: Partial<Record<ConnectivityCheckId, boolean>> = {
		outbound: sending === 0,
		inbound: receiving === 0,
	};

	const checks: ConnectivityCheck[] = CHECK_ORDER.map((id) => {
		const issues = activeIssuesOf(monitor, id, stalled[id] ?? true);

		switch (id) {
			case 'candidates':
				return { id, issues, status: statusOf(issues, candidates.total > 0), detail: candidates.detail };
			case 'stun':
				return { id, issues, status: statusOf(issues, anyStunAnswered(monitor)) };
			case 'icePath':
				return { id, issues, status: statusOf(issues, iceConnected), detail: pathDetail(monitor) };
			case 'dtls':
				return { id, issues, status: statusOf(issues, anyDtlsConnected(monitor)), detail: dtlsDetail(monitor) };
			case 'outbound':
				return { id, issues, status: statusOf(issues, sending > 0), detail: sending > 0 ? kbps(sending) : undefined };
			default:
				return {
					id,
					issues: expectInbound ? issues : [],
					status: expectInbound ? statusOf(issues, receiving > 0) : 'skipped',
					detail: receiving > 0 ? kbps(receiving) : undefined,
				};
		}
	});

	const culprit = checks.find((check) => check.status === 'failed')?.id;

	return { checks, culprit };
};
