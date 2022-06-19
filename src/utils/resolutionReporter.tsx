import EventEmitter from 'events';
import { Resolution, ResolutionWatcher } from './resolutionWatcher';

export declare interface ResolutionReporter {
	// eslint-disable-next-line no-unused-vars
	on(event: 'updateResolution', listener: () => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'close', listener: () => void): this;
}

export class ResolutionReporter extends EventEmitter {
	public resolution: Resolution = { width: 320, height: 240 };

	public close(): void {
		this.emit('close');
		this.removeAllListeners();
	}

	public updateResolution(resolution: Resolution): void {
		if (ResolutionWatcher.compareResolutions(resolution, this.resolution) !== 0) {
			this.resolution = resolution;

			this.emit('updateResolution');
		}
	}
}