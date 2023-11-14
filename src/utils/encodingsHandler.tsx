import type { RtpCapabilities, RtpEncodingParameters } from 'mediasoup-client/lib/RtpParameters';
import { Resolution, SimulcastProfile } from './types';

const VIDEO_CONSTRAINS: Record<Resolution, Record<string, number>> = {
	'low': { width: 320 },
	'medium': { width: 640 },
	'high': { width: 1280 },
	'veryhigh': { width: 1920 },
	'ultra': { width: 3840 }
};

const SIMULCAST_PROFILES = {
	'320': [ {
		'scaleResolutionDownBy': 1,
		'maxBitrate': 150000
	} ],
	'640': [ {
		'scaleResolutionDownBy': 2,
		'maxBitrate': 150000
	}, {
		'scaleResolutionDownBy': 1,
		'maxBitrate': 500000
	} ],
	'1280': [ {
		'scaleResolutionDownBy': 4,
		'maxBitrate': 150000
	}, {
		'scaleResolutionDownBy': 2,
		'maxBitrate': 500000
	}, {
		'scaleResolutionDownBy': 1,
		'maxBitrate': 1200000
	} ],
	'1920': [ {
		'scaleResolutionDownBy': 6,
		'maxBitrate': 150000
	}, {
		'scaleResolutionDownBy': 3,
		'maxBitrate': 500000
	}, {
		'scaleResolutionDownBy': 1,
		'maxBitrate': 3500000
	} ],
	'3840': [ {
		'scaleResolutionDownBy': 12,
		'maxBitrate': 150000
	}, {
		'scaleResolutionDownBy': 6,
		'maxBitrate': 500000
	}, {
		'scaleResolutionDownBy': 1,
		'maxBitrate': 10000000
	} ]
};

// Used for VP9 webcam video.
const VIDEO_KSVC_ENCODINGS: RtpEncodingParameters[] =
	[ { scalabilityMode: 'S3T3_KEY' } ];

// Used for VP9 desktop sharing.
const VIDEO_SVC_ENCODINGS: RtpEncodingParameters[] =
	[ { scalabilityMode: 'S3T3', dtx: true } ];

/**
 * 
 * @param rtpCapabilities - The RTP capabilities of the mediasoup router.
 * @param width - The width of the video.
 * @param height - The height of the video.
 * @param screenSharing - Whether the video is for screen sharing.
 * @returns {RtpEncodingParameters[]} The video RTP parameters.
 */
export const getEncodings = (
	rtpCapabilities: RtpCapabilities,
	width: number | undefined,
	height: number | undefined,
	svc = false,
	screenSharing = false
): RtpEncodingParameters[] => {
	if (!width || !height)
		throw new Error('missing width or height');

	const firstVideoCodec =
		rtpCapabilities.codecs?.find((c) => c.kind === 'video');

	if (!firstVideoCodec)
		throw new Error('No video codecs');

	let encodings: RtpEncodingParameters[];
	const size = (width > height ? width : height);

	if (svc)
		encodings = screenSharing ? VIDEO_SVC_ENCODINGS : VIDEO_KSVC_ENCODINGS;
	else
		encodings = chooseEncodings(SIMULCAST_PROFILES, size);

	return encodings;
};

/**
 * Returns the simulcast profile for the given resolution.
 * 
 * @param simulcastProfiles - The simulcast profiles.
 * @param size - The resolution.
 * @returns {RtpEncodingParameters[]} The simulcast profile.
 */
const chooseEncodings = (
	simulcastProfiles: Record<string, SimulcastProfile[]>,
	size: number,
): RtpEncodingParameters[] => {
	let encodings: RtpEncodingParameters[] = [];

	const sortedMap = new Map([ ...Object.entries(simulcastProfiles) ]
		.sort((a, b) => parseInt(b[0]) - parseInt(a[0])));

	for (const [ key, value ] of sortedMap) {
		if (parseInt(key) < size) {
			if (encodings === null)
				encodings = value;

			break;
		}

		encodings = value;
	}

	// hack as there is a bug in mediasoup
	if (encodings.length === 1)
		encodings.push({ ...encodings[0] });

	return encodings;
};

/**
 * Returns the video constraints for the given resolution.
 * 
 * @param resolution - The resolution.
 * @param aspectRatio - The aspect ratio.
 * @returns {MediaTrackConstraints} The video constraints.
 */
export const getVideoConstrains = (
	resolution: Resolution,
	aspectRatio: number
): Record<'width' | 'height', Record<'ideal', number>> => {
	return {
		width: { ideal: VIDEO_CONSTRAINS[resolution].width },
		height: { ideal: VIDEO_CONSTRAINS[resolution].width / aspectRatio }
	};
};