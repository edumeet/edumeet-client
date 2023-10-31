import EventEmitter from 'events';
import { Resolution, ResolutionWatcher } from './resolutionWatcher';

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export declare interface ResolutionReporter {
	// eslint-disable-next-line no-unused-vars
	on(event: 'updateResolution', listener: () => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'close', listener: () => void): this;
}

/**
 * ResolutionReporter is a class that reports the resolution of a video element.
 * Any time the resolution changes, it emits an 'updateResolution' event. Any
 * video element that is being rendered to the screen should have a ResolutionReporter
 * attached to it.
 * 
 * @emits updateResolution - Emitted when the resolution changes.
 * @emits close - Emitted when the video element is removed from the DOM.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
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