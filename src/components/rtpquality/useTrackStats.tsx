import { useContext, useEffect, useState } from 'react';
import type {
	ClientMonitor,
	InboundTrackMonitor,
	OutboundTrackMonitor,
} from '@observertc/client-monitor-js';
import { ServiceContext } from '../../store/store';
import { ProducerSource } from '../../utils/types';
import { QualityIssue, ScoreReason, toQualityIssues, toScoreReasons } from './qualityScore';

export type Quality = {
	score?: number;
	reasons: ScoreReason[];
	issues: QualityIssue[];
};

export type LayerStats = {
	ssrc: number;
	rid?: string;
	bitrateKbps?: number;
	frameWidth?: number;
	frameHeight?: number;
	fps?: number;
};

export type TrackStats = {
	kind: 'audio' | 'video';
	ssrc?: number;
	codec?: string;
	// `simulcast` or `SVC L3T3` for video, undefined otherwise.
	mode?: string;
	bitrateKbps?: number;
	fractionLost?: number;
	jitterMs?: number;
	rttMs?: number;
	frameWidth?: number;
	frameHeight?: number;
	fps?: number;
	paused?: boolean;
	score?: number;
	reasons: ScoreReason[];
	issues: QualityIssue[];
	// Inbound video: currently received / requested simulcast-SVC layers.
	spatialLayer?: number;
	temporalLayer?: number;
	preferredSpatialLayer?: number;
	preferredTemporalLayer?: number;
	// Outbound video: one entry per active encoding.
	layers?: LayerStats[];
};

type RtpParametersLike = {
	codecs?: Array<{ mimeType?: string }>;
	encodings?: Array<{ scalabilityMode?: string }>;
};

const toKbps = (bitrate?: number): number | undefined => (
	bitrate === undefined ? undefined : Math.floor(bitrate / 1000)
);

const codecName = (rtpParameters?: RtpParametersLike): string | undefined =>
	rtpParameters?.codecs?.[0]?.mimeType?.split('/')?.[1]?.toUpperCase();

const spatialLayerCount = (scalabilityMode?: string): number =>
	parseInt(scalabilityMode?.match(/^[LS](\d+)/)?.[1] ?? '1', 10);

/** `SVC L3T3` for SVC codecs with more than one spatial layer, `simulcast` for multiple encodings. */
export const encodingMode = (rtpParameters?: RtpParametersLike): string | undefined => {
	const codec = codecName(rtpParameters);
	const encodings = rtpParameters?.encodings ?? [];
	const scalabilityMode = encodings[0]?.scalabilityMode;
	const isSVC = (codec === 'VP9' || codec === 'AV1') && spatialLayerCount(scalabilityMode) > 1;

	if (isSVC) return `SVC ${scalabilityMode}`;
	if (encodings.length > 1) return 'simulcast';

	return undefined;
};

/**
 * Active issue types of a track monitor.
 * `IssueRegistry` is keyed by issue key, so the types are read off the entries.
 */
const activeIssues = (trackMonitor: InboundTrackMonitor | OutboundTrackMonitor): QualityIssue[] => {
	const types = new Set<string>();

	for (const issueKey of Array.from(trackMonitor.issues.keys())) {
		const type = trackMonitor.issues.get(issueKey)?.type;

		if (type) types.add(type);
	}

	return toQualityIssues(types);
};

const inboundTrackStats = (
	trackMonitor: InboundTrackMonitor,
	rtpParameters?: RtpParametersLike,
	currentLayers?: { spatialLayer?: number, temporalLayer?: number },
	preferredLayers?: { spatialLayer: number, temporalLayer: number },
): TrackStats => {
	const rtp = trackMonitor.getInboundRtp();

	return {
		kind: trackMonitor.kind === 'audio' ? 'audio' : 'video',
		ssrc: rtp?.ssrc,
		codec: codecName(rtpParameters),
		mode: encodingMode(rtpParameters),
		bitrateKbps: toKbps(trackMonitor.bitrate),
		fractionLost: trackMonitor.fractionLost === undefined
			? undefined
			: Math.round(trackMonitor.fractionLost * 10000) / 10000,
		jitterMs: trackMonitor.jitter === undefined ? undefined : Math.round(trackMonitor.jitter * 1000),
		frameWidth: rtp?.frameWidth,
		frameHeight: rtp?.frameHeight,
		fps: rtp?.framesPerSecond,
		paused: trackMonitor.paused || trackMonitor.remoteOutboundTrackPaused,
		score: trackMonitor.calculatedScore?.value ?? trackMonitor.score,
		reasons: toScoreReasons(trackMonitor.calculatedScore?.reasons ?? trackMonitor.scoreReasons),
		issues: activeIssues(trackMonitor),
		spatialLayer: currentLayers?.spatialLayer,
		temporalLayer: currentLayers?.temporalLayer,
		preferredSpatialLayer: preferredLayers?.spatialLayer,
		preferredTemporalLayer: preferredLayers?.temporalLayer,
	};
};

const outboundTrackStats = (
	trackMonitor: OutboundTrackMonitor,
	rtpParameters?: RtpParametersLike,
): TrackStats => {
	const rtps = trackMonitor.getOutboundRtps();
	const highest = trackMonitor.highestLayer ?? rtps[0];
	const rttInSec = highest?.getRemoteInboundRtp()?.roundTripTime;

	return {
		kind: trackMonitor.kind === 'audio' ? 'audio' : 'video',
		ssrc: highest?.ssrc,
		codec: codecName(rtpParameters),
		mode: encodingMode(rtpParameters),
		bitrateKbps: toKbps(trackMonitor.bitrate),
		fractionLost: trackMonitor.fractionLost === undefined
			? undefined
			: Math.round(trackMonitor.fractionLost * 10000) / 10000,
		rttMs: rttInSec === undefined ? undefined : Math.round(Math.max(0, rttInSec) * 1000),
		frameWidth: highest?.frameWidth,
		frameHeight: highest?.frameHeight,
		fps: highest?.framesPerSecond,
		paused: trackMonitor.paused,
		score: trackMonitor.calculatedScore?.value ?? trackMonitor.score,
		reasons: toScoreReasons(trackMonitor.calculatedScore?.reasons ?? trackMonitor.scoreReasons),
		issues: activeIssues(trackMonitor),
		layers: rtps
			.filter((rtp) => rtp.active !== false)
			.map((rtp) => ({
				ssrc: rtp.ssrc,
				rid: rtp.rid,
				bitrateKbps: toKbps(rtp.bitrate),
				frameWidth: rtp.frameWidth,
				frameHeight: rtp.frameHeight,
				fps: rtp.framesPerSecond,
			}))
			.sort((a, b) => ((b.frameWidth ?? 0) * (b.frameHeight ?? 0)) - ((a.frameWidth ?? 0) * (a.frameHeight ?? 0))),
	};
};

/**
 * Subscribes to the client monitor and re-reads the stats of one inbound
 * (consumed) track on every collected stats round.
 *
 * Track monitors are looked up by the *track id*, which is the only identifier
 * the monitor knows about - there is deliberately no "any inbound track of the
 * same kind" fallback, since that used to show another peer's numbers.
 */
export const useInboundTrackStats = (consumerId?: string): TrackStats | undefined => {
	const { mediaService } = useContext(ServiceContext);
	const [ stats, setStats ] = useState<TrackStats | undefined>();

	useEffect(() => {
		const monitor: ClientMonitor | undefined = mediaService.monitor;

		setStats(undefined);

		if (!monitor || !consumerId) return;

		const listener = () => {
			const consumer = mediaService.getConsumer(consumerId);
			const trackId = consumer?.track?.id;
			const trackMonitor = trackId ? monitor.getInboundTrackMonitor(trackId) : undefined;

			if (!trackMonitor) return setStats(undefined);

			setStats(inboundTrackStats(
				trackMonitor,
				consumer?.rtpParameters as RtpParametersLike | undefined,
				mediaService.consumerCurrentLayers.get(consumerId),
				mediaService.consumerPreferredLayers.get(consumerId),
			));
		};

		monitor.on('stats-collected', listener);
		listener();

		return () => {
			monitor.off('stats-collected', listener);
		};
	}, [ mediaService, mediaService.monitor, consumerId ]);

	return stats;
};

/**
 * Same as {@link useInboundTrackStats} but for a locally produced track.
 *
 * The producer sends a *clone* of the media sender's track, so the monitor only
 * knows `producer.track.id` - looking the monitor up by the sender's own track
 * would never match.
 */
export const useOutboundTrackStats = (source?: ProducerSource): TrackStats | undefined => {
	const { mediaService } = useContext(ServiceContext);
	const [ stats, setStats ] = useState<TrackStats | undefined>();

	useEffect(() => {
		const monitor: ClientMonitor | undefined = mediaService.monitor;

		setStats(undefined);

		if (!monitor || !source) return;

		const listener = () => {
			const producer = mediaService.mediaSenders[source]?.producer;
			const trackId = producer?.track?.id;
			const trackMonitor = trackId ? monitor.getOutboundTrackMonitor(trackId) : undefined;

			if (!trackMonitor) return setStats(undefined);

			setStats(outboundTrackStats(trackMonitor, producer?.rtpParameters as RtpParametersLike | undefined));
		};

		monitor.on('stats-collected', listener);
		listener();

		return () => {
			monitor.off('stats-collected', listener);
		};
	}, [ mediaService, mediaService.monitor, source ]);

	return stats;
};
