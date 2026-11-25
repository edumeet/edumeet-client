import EventEmitter from 'events';
import { Harker } from 'hark';

export const DEFAULT_NOISE_THRESHOLD = -60;

// Only the slider range (-100 to 0 dB) is accepted. Anything else, such as a value in another unit
// in a config file, would hide every sound, so it falls back to the default.
export const validNoiseThreshold = (threshold: unknown): number =>
	(typeof threshold === 'number' && threshold >= -100 && threshold <= 0 ? threshold : DEFAULT_NOISE_THRESHOLD);

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export declare interface VolumeWatcher {
	// eslint-disable-next-line no-unused-vars
	on(event: 'volumeChange', listener: (
		// eslint-disable-next-line no-unused-vars
		{ volume, scaledVolume }: { volume: number, scaledVolume: number }
	) => void): this;
}

/**
 * VolumeWatcher is a class that wraps a hark instance
 * tied to a Consumer or Producer and emits events when
 * the volume changes.
 * 
 * @emits volumeChange - Emitted when the volume changes.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class VolumeWatcher extends EventEmitter {
	public hark: Harker;
	public threshold: number;
	public stopped = false;
	private lastVolume = -100;
	public lastScaledVolume = 0;

	constructor({ hark, threshold }: { hark: Harker, threshold?: number }) {
		super();

		this.hark = hark;
		this.threshold = validNoiseThreshold(threshold);

		this.handleHark();
	}

	public setThreshold(threshold: number): void {
		this.threshold = validNoiseThreshold(threshold);
		this.hark.setThreshold(this.threshold);
	}

	public stop(): void {
		this.stopped = true;
		this.hark.stop();
		this.lastVolume = -100;
		this.lastScaledVolume = 0;
		this.emit('volumeChange', { volume: -100, scaledVolume: 0 });
	}

	private handleHark(): void {
		this.hark.on('volume_change', (volume: number) => {
			let newVolume = Math.round(volume);

			if (Math.abs(newVolume - this.lastVolume) > 0.5) {
				if (newVolume < this.lastVolume) {
					newVolume =
						Math.round(
							this.lastVolume - (
								Math.pow((newVolume - this.lastVolume) / (100 + this.lastVolume), 2) * 10
							)
						);
				}

				this.lastVolume = newVolume;
				let lastScaledVolume = Math.round((newVolume - this.threshold) * 10 / Math.max(-this.threshold, 1));

				if (lastScaledVolume < 0)
					lastScaledVolume = 0;

				this.lastScaledVolume = lastScaledVolume;

				this.emit('volumeChange', { volume: newVolume, scaledVolume: this.lastScaledVolume });
			}
		});
	}
}