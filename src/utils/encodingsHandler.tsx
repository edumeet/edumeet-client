import type { RtpEncodingParameters } from 'mediasoup-client/lib/RtpParameters';
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
		'maxBitrate': 150_000
	} ],
	'640': [ {
		'scaleResolutionDownBy': 2,
		'maxBitrate': 150_000
	}, {
		'scaleResolutionDownBy': 1,
		'maxBitrate': 500_000
	} ],
	'1280': [ {
		'scaleResolutionDownBy': 4,
		'maxBitrate': 150_000
	}, {
		'scaleResolutionDownBy': 2,
		'maxBitrate': 500_000
	}, {
		'scaleResolutionDownBy': 1,
		'maxBitrate': 1_200_000
	} ],
	'1920': [ {
		'scaleResolutionDownBy': 6,
		'maxBitrate': 150_000
	}, {
		'scaleResolutionDownBy': 3,
		'maxBitrate': 500_000
	}, {
		'scaleResolutionDownBy': 1,
		'maxBitrate': 3_500_000
	} ],
	'3840': [ {
		'scaleResolutionDownBy': 12,
		'maxBitrate': 150_000
	}, {
		'scaleResolutionDownBy': 6,
		'maxBitrate': 500_000
	}, {
		'scaleResolutionDownBy': 1,
		'maxBitrate': 10_000_000
	} ]
};

const SVC_ENCODINGS = {
	'320': [ { 'scalabilityMode': 'L1T2_KEY', 'maxBitrate': 120_000 } ],
	'640': [ { 'scalabilityMode': 'L2T2_KEY', 'maxBitrate': 350_000 } ],
	'1280': [ { 'scalabilityMode': 'L3T2_KEY', 'maxBitrate': 1_000_000 } ],
	'1920': [ { 'scalabilityMode': 'L3T2_KEY', 'maxBitrate': 2_500_000 } ],
	'3840': [ { 'scalabilityMode': 'L3T2_KEY', 'maxBitrate': 5_000_000 } ]
};

const SVC_SCREEN_SHARING_ENCODINGS = {
	'320': [ { 'scalabilityMode': 'L1T2', 'maxBitrate': 120_000 } ],
	'640': [ { 'scalabilityMode': 'L2T2', 'maxBitrate': 350_000 } ],
	'1280': [ { 'scalabilityMode': 'L2T2', 'maxBitrate': 1_000_000 } ],
	'1920': [ { 'scalabilityMode': 'L2T2', 'maxBitrate': 2_500_000 } ],
	'3840': [ { 'scalabilityMode': 'L3T2', 'maxBitrate': 5_000_000 } ]
};

/**
 * 
 * @param rtpCapabilities - The RTP capabilities of the mediasoup router.
 * @param width - The width of the video.
 * @param height - The height of the video.
 * @param screenSharing - Whether the video is for screen sharing.
 * @returns {RtpEncodingParameters[]} The video RTP parameters.
 */
export const getEncodings = (
	width: number | undefined,
	height: number | undefined,
	svc = false,
	screenSharing = false
): RtpEncodingParameters[] => {
	if (!width || !height)
		throw new Error('missing width or height');

	let encodings: RtpEncodingParameters[];
	const size = (width > height ? width : height);

	if (svc)
		encodings = screenSharing ? chooseEncodings(SVC_SCREEN_SHARING_ENCODINGS, size) : chooseEncodings(SVC_ENCODINGS, size);
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
