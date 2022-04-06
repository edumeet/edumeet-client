import EventEmitter from 'events';
import {
	RtpCapabilities,
	RtpEncodingParameters
} from 'mediasoup-client/lib/RtpParameters';
import edumeetConfig from '../utils/edumeetConfig';
import { Logger } from '../utils/logger';
import { Resolution, SimulcastProfile } from '../utils/types';

const logger = new Logger('MediaService');

const VIDEO_CONSTRAINS: Record<Resolution, Record<string, number>> = {
	'low': { width: 320 },
	'medium': { width: 640 },
	'high': { width: 1280 },
	'veryhigh': { width: 1920 },
	'ultra': { width: 3840 }
};

// Used for VP9 webcam video.
const VIDEO_KSVC_ENCODINGS: RtpEncodingParameters[] =
	[ { scalabilityMode: 'S3T3_KEY' } ];

// Used for VP9 desktop sharing.
const VIDEO_SVC_ENCODINGS: RtpEncodingParameters[] =
	[ { scalabilityMode: 'S3T3', dtx: true } ];

export interface MediaDevice {
	deviceId: string;
	kind: MediaDeviceKind;
	label: string;
}

export interface DevicesUpdated {
	devices: MediaDeviceInfo[];
	removedDevices: MediaDeviceInfo[];
	newDevices: MediaDeviceInfo[];
}

export class MediaService extends EventEmitter {
	private devices: MediaDevice[] = [];
	private tracks: Map<string, MediaStreamTrack> = new Map();

	public getTrack(trackId: string): MediaStreamTrack | undefined {
		return this.tracks.get(trackId);
	}

	public addTrack(track: MediaStreamTrack): void {
		logger.debug('addTrack() [trackId:%s]', track.id);

		this.tracks.set(track.id, track);

		track.addEventListener('ended', () => {
			logger.debug('addTrack() | track "ended" [trackId:%s]', track.id);

			this.tracks.delete(track.id);
		});
	}

	public removeTrack(trackId: string | undefined): void {
		logger.debug('removeTrack() [trackId:%s]', trackId);

		trackId && this.tracks.delete(trackId);
	}

	public getEncodings(
		rtpCapabilities: RtpCapabilities,
		width: number | undefined,
		height: number | undefined,
		screenSharing?: boolean
	): RtpEncodingParameters[] {
		if (!width || !height) {
			throw new Error('missing width or height');
		}

		const firstVideoCodec = rtpCapabilities.codecs?.find((c) => c.kind === 'video');

		if (!firstVideoCodec) {
			throw new Error('No video codecs');
		}

		let encodings: RtpEncodingParameters[];
		const size = (width > height ? width : height);

		if (firstVideoCodec.mimeType.toLowerCase() === 'video/vp9') {
			encodings = screenSharing ? VIDEO_SVC_ENCODINGS : VIDEO_KSVC_ENCODINGS;
		} else {
			encodings = this.chooseEncodings(edumeetConfig.simulcastProfiles, size);
		}

		return encodings;
	}

	private chooseEncodings(
		simulcastProfiles: Record<string, SimulcastProfile[]>,
		size: number,
	): RtpEncodingParameters[] {
		let encodings: RtpEncodingParameters[] = [];

		const sortedMap = new Map([ ...Object.entries(simulcastProfiles) ]
			.sort((a, b) => parseInt(b[0]) - parseInt(a[0])));

		for (const [ key, value ] of sortedMap) {
			if (parseInt(key) < size) {
				if (encodings === null) {
					encodings = value;
				}

				break;
			}

			encodings = value;
		}

		// hack as there is a bug in mediasoup
		if (encodings.length === 1) {
			encodings.push({ ...encodings[0] });
		}

		return encodings;
	}
	
	public getVideoConstrains(
		resolution: Resolution,
		aspectRatio: number
	): Record<'width' | 'height', Record<'ideal', number>> {
		return {
			width: { ideal: VIDEO_CONSTRAINS[resolution].width },
			height: { ideal: VIDEO_CONSTRAINS[resolution].width / aspectRatio }
		};
	}

	public async updateMediaDevices(): Promise<void> {
		logger.debug('updateMediaDevices()');

		let removedDevices: MediaDevice[];
		let newDevices: MediaDevice[];

		try {
			const devicesList =
				(await navigator.mediaDevices.enumerateDevices())
					.filter((d) => d.deviceId)
					.map((d) => ({ deviceId: d.deviceId, kind: d.kind, label: d.label }));

			if (devicesList.length === 0)
				return;

			removedDevices =
				this.devices.filter(
					(device) => !devicesList.find((d) => d.deviceId === device.deviceId)
				);
			
			newDevices =
				devicesList.filter(
					(device) => !this.devices.find((d) => d.deviceId === device.deviceId)
				);

			this.devices = devicesList;

			this.emit('devicesUpdated', {
				devices: this.devices,
				removedDevices,
				newDevices
			});
		} catch (error) {
			logger.error('updateMediaDevices() [error:%o]', error);
		}
	}

	public getDeviceId(deviceId: string, kind: MediaDeviceKind): string | undefined {
		let device = this.devices.find((d) => d.deviceId === deviceId);

		if (!device) {
			device = this.devices.find((d) => d.kind === kind);
		}

		return device?.deviceId;
	}
}