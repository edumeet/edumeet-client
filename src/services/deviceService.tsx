import EventEmitter from 'events';
import { Logger } from '../utils/Logger';

const logger = new Logger('DeviceService');

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

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export declare interface DeviceService {
	// eslint-disable-next-line no-unused-vars
	on(event: 'devicesUpdated', listener: (updatedDevices: DevicesUpdated) => void): this;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class DeviceService extends EventEmitter {
	private devices: MediaDevice[] = [];

	public async updateMediaDevices(): Promise<void> {
		logger.debug('updateMediaDevices()');

		let removedDevices: MediaDevice[];
		let newDevices: MediaDevice[];

		try {
			const rawDevices = await navigator.mediaDevices.enumerateDevices();

			// Firefox withholds the deviceId of a device that is currently in use
			// by another application, returning an empty string instead. We assign a
			// synthetic ID so those devices still appear in the chooser. The synthetic
			// ID is never passed to getUserMedia — see getDeviceId().
			const devicesList = rawDevices.map((d, i) => ({
				deviceId: d.deviceId || `unavailable-${d.kind}-${i}`,
				kind: d.kind,
				label: d.label,
			}));

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

	public getDeviceId(
		deviceId: string | undefined,
		kind: MediaDeviceKind
	): string | undefined {
		let device = this.devices.find((d) => d.deviceId === deviceId);

		if (!device)
			device = this.devices.find((d) => d.kind === kind);

		const resolvedId = device?.deviceId;

		// Synthetic IDs are not real browser device IDs — skip the deviceId
		// constraint so getUserMedia falls back to the browser default.
		if (resolvedId?.startsWith('unavailable-')) return undefined;

		return resolvedId;
	}
}
