import EventEmitter from 'events';
import { ResolutionReporter } from './resolutionReporter';

export interface Resolution {
	width: number;
	height: number;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export declare interface ResolutionWatcher {
	// eslint-disable-next-line no-unused-vars
	on(event: 'newResolution', listener: (resolution: Resolution) => void): this;
}

/**
 * ResolutionWatcher is a class that correlates the reports from all
 * ResolutionReporter instances and emits the current highest resolution
 * a video track is being rendered at.
 * 
 * @emits newResolution - Emitted when the resolution changes.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class ResolutionWatcher extends EventEmitter {
	private resolutionReporters: ResolutionReporter[] = [];
	private currentResolution: Resolution = { width: 320, height: 240 };

	public createResolutionReporter(): ResolutionReporter {
		const resolutionReporter = new ResolutionReporter();

		this.resolutionReporters.push(resolutionReporter);

		resolutionReporter.on('close', () => {
			this.resolutionReporters = this.resolutionReporters.filter(
				(r) => r !== resolutionReporter
			);

			if (this.resolutionReporters.length === 0)
				return;

			const { resolution } = this.resolutionReporters
				.reduce(
					(prev, current) =>
						((prev.resolution.width > current.resolution.width) ? prev : current)
				);

			this.currentResolution = resolution;
			this.emit('newResolution', this.currentResolution);
		});

		resolutionReporter.on('updateResolution', (): void => {
			const { resolution } = this.resolutionReporters
				.reduce(
					(prev, current) =>
						((prev.resolution.width > current.resolution.width) ? prev : current)
				);

			if (
				ResolutionWatcher.compareResolutions(resolution, this.currentResolution) !== 0
			) {
				this.currentResolution = resolution;

				this.emit('newResolution', this.currentResolution);
			}
		});

		return resolutionReporter;
	}

	public static compareResolutions(resA: Resolution, resB: Resolution): number {
		if (resA.width === resB.width)
			return 0;
		else if (resA.width > resB.width)
			return 1;
		else
			return -1;
	}
}