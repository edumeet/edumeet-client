import EventEmitter from 'events';
import { describe, expect, it, vi } from 'vitest';
import { validNoiseThreshold, VolumeWatcher } from './volumeWatcher';

const fakeHark = () => Object.assign(new EventEmitter(), { stop: vi.fn(), setThreshold: vi.fn() });

const scaledAt = (volume: number, threshold?: number): number | undefined => {
	const hark = fakeHark();
	const watcher = new VolumeWatcher({ hark: hark as never, threshold });
	let scaled: number | undefined;

	watcher.on('volumeChange', ({ scaledVolume }) => {
		scaled = scaledVolume;
	});
	hark.emit('volume_change', volume);

	return scaled;
};

describe('the noise threshold of a volume meter', () => {
	it('keeps the -60 dB scale when no threshold is given', () => {
		expect(scaledAt(-30)).toBe(5);
		expect(scaledAt(-50)).toBe(2);
		expect(scaledAt(-70)).toBe(0);
	});

	it('ignores sound below a stricter threshold', () => {
		expect(scaledAt(-50, -40)).toBe(0);
		expect(scaledAt(-20, -40)).toBe(5);
	});

	it('uses the default for a value outside -100 to 0 dB', () => {
		expect(scaledAt(-30, 0.2)).toBe(5);
		expect(validNoiseThreshold(0.2)).toBe(-60);
		expect(validNoiseThreshold(-200)).toBe(-60);
		expect(validNoiseThreshold(Number.NaN)).toBe(-60);
		expect(validNoiseThreshold(undefined)).toBe(-60);
		expect(validNoiseThreshold('-45')).toBe(-60);
		expect(validNoiseThreshold(-45)).toBe(-45);
		expect(validNoiseThreshold(-100)).toBe(-100);
		expect(validNoiseThreshold(0)).toBe(0);
	});

	it('applies a changed threshold to the meter and to hark', () => {
		const hark = fakeHark();
		const watcher = new VolumeWatcher({ hark: hark as never });
		const scaled: number[] = [];

		watcher.on('volumeChange', ({ scaledVolume }) => scaled.push(scaledVolume));
		watcher.setThreshold(-40);
		hark.emit('volume_change', -50);

		expect(hark.setThreshold).toHaveBeenCalledWith(-40);
		expect(scaled).toEqual([ 0 ]);

		watcher.setThreshold(5);

		expect(watcher.threshold).toBe(-60);
		expect(hark.setThreshold).toHaveBeenLastCalledWith(-60);
	});

	it('ends on silence when it stops, so a speaking indicator does not stay on', () => {
		const hark = fakeHark();
		const watcher = new VolumeWatcher({ hark: hark as never });
		const scaled: number[] = [];

		watcher.on('volumeChange', ({ scaledVolume }) => scaled.push(scaledVolume));
		hark.emit('volume_change', -20);
		watcher.stop();

		expect(hark.stop).toHaveBeenCalled();
		expect(scaled[scaled.length - 1]).toBe(0);
		expect(watcher.stopped).toBe(true);
	});
});
