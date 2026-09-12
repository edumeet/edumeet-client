import { intl } from '../../utils/intlManager';

/**
 * Plain language explanations for the score reasons and issue types that
 * `@observertc/client-monitor-js` reports.
 *
 * The keys are the library's own identifiers: the score reason keys come from
 * DefaultScoreCalculator, the rest are ClientMonitorIssueType values. Anything
 * not listed here still renders (with its humanized label), it just has no
 * explanation - so a library upgrade that adds a detector degrades gracefully
 * instead of breaking.
 *
 * The strings here are the English defaults. They are looked up as
 * `quality.explanation.<key>` in `src/translations/*.json`, and a locale that
 * has no entry for one falls back to the default below.
 */
const EXPLANATION_DEFAULTS: Record<string, string> = {
	// Score reasons - inbound video
	'blocky-video': 'The picture is coarsely compressed, so it looks blocky or smeared. The sender is not getting enough bandwidth for this resolution.',
	'choppy-video': 'Frames arrive unevenly, so motion stutters even though video is still flowing.',
	'dropped-video-frames': 'Decoded frames are being thrown away before they reach the screen, usually because this device cannot keep up.',
	'frozen-video': 'The picture has stopped updating while the track is still live.',
	'volatile-fps': 'The time between frames keeps changing, which shows up as uneven, jerky motion.',

	// Score reasons - inbound audio
	'audio-jitter-buffer-stress': 'The jitter buffer is stretching and compressing audio to cope with irregular arrival, which distorts the sound.',
	'invented-speech': 'The decoder is filling gaps with invented audio because packets are missing, which sounds robotic or warbly.',
	'synthesized-audio': 'Part of the audio being played was synthesized to cover lost packets rather than actually received.',

	// Score reasons - outbound video
	'downscaled-screenshare': 'The screen share is being sent at a much lower resolution than it is captured at, so text will look soft.',
	'encoder-bottleneck': 'The video encoder cannot keep up with the capture rate, so frames are dropped before they are sent.',
	'high-deviation-from-target-bitrate': 'Much less video is being sent than the encoder is aiming for, typically a sign of a constrained uplink.',
	'video-capture-bottleneck': 'The camera or capture pipeline is delivering fewer frames than requested.',

	// Score reasons - outbound audio
	'silent-audio-source': 'The microphone is producing silence. It may be muted at the OS level or captured from the wrong device.',

	// Score reasons - transport / shared with issues
	'dry-inbound-track': 'The track is subscribed but no media is arriving at all.',
	'dry-outbound-track': 'The track is being produced but no media is leaving this device.',
	'stuck-decoder': 'Data is arriving but the decoder has stopped producing frames from it.',
	'transport-delay-degraded': 'Round trip time has risen and stayed high, which adds noticeable delay to the conversation.',
	'transport-loss-sustained': 'Packets are being lost continuously rather than in short bursts.',
	'unstable-transport': 'The network path keeps changing quality, so quality will fluctuate.',
	'uplink-congestion': 'More data is being sent than the upload can carry, so the sender is being throttled.',
	'downlink-congestion': 'More data is arriving than the download can carry, so incoming media is being cut back.',

	// Issue types not already covered above
	'av-desync': 'Audio and video have drifted apart, so lips no longer match the sound.',
	'audio-playout-synthesis': 'Audio playout is being synthesized to cover missing packets.',
	'blocked-inbound-media-transport': 'Incoming media appears to be blocked by a firewall or proxy.',
	'blocked-outbound-media-transport': 'Outgoing media appears to be blocked by a firewall or proxy.',
	'blocked-stun-requests': 'STUN requests are not getting through, so the connection cannot discover a network path.',
	congestion: 'The connection is carrying more media than it can handle, so quality is being reduced to compensate.',
	cpulimitation: 'This device is short on CPU, so media quality is being reduced to keep the call running.',
	'decoder-bottleneck': 'Frames are arriving faster than this device can decode them.',
	'dtls-handshake-failed': 'The media connection could not be secured, so media cannot flow.',
	'dtls-handshake-stalled': 'Securing the media connection is taking unusually long.',
	'frame-assembly-stalled': 'Packets are arriving but no longer add up to complete video frames.',
	'ice-connection-failed': 'No usable network path to the server could be established.',
	'ice-disconnected': 'The network path to the server dropped and is being re-established.',
	'ice-establishment-failed': 'Setting up the network path to the server failed.',
	'ice-transport-stalled': 'The network path is up but has stopped responding.',
	'inbound-video-playout-discrepancy': 'Video is being decoded but not shown at the expected rate, so playback lags behind what was received.',
	'no-available-ice-candidate': 'No reachable network address was found for this connection.',
	'pixelated-video': 'The picture is heavily compressed for the size it is displayed at, so it looks pixelated.',
	'rtp-sender-stalled': 'The sender has stopped transmitting media on this connection.',
	'transport-demux-stalled': 'Media is arriving but can no longer be sorted onto its tracks.',
	'unstable-ice-path': 'The network path keeps switching, which interrupts media.',
	'video-decoder-overloaded': 'Decoding takes longer than the time available per frame, so video falls behind.',
	'video-flow-disrupted': 'Incoming video is no longer flowing smoothly - it is choppy or frozen.',
	'video-recovery-failed': 'Video stalled and repeated requests for a fresh keyframe have not recovered it.',
	'capture-source-lost': 'The camera or screen being captured has gone away.',
	'capture-track-muted': 'The captured track has been muted by the system.',
};

/**
 * The translated explanation for a score reason or issue key, when there is one.
 *
 * The id is built from the key rather than written out per string, because the
 * key set is the library's and grows with it - an unknown key simply has no
 * explanation.
 */
export const describeQualityKey = (key: string): string | undefined => {
	const defaultMessage = EXPLANATION_DEFAULTS[key];

	if (!defaultMessage) return undefined;

	return intl.formatMessage({ id: `quality.explanation.${key}`, defaultMessage });
};
