import EventEmitter from 'events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('hark', () => ({
	default: vi.fn(() => Object.assign(new EventEmitter(), { stop: vi.fn(), setThreshold: vi.fn() }))
}));

import { MediaSender } from './mediaSender';

const fakeTrack = () => {
	const copy = { kind: 'audio', stop: vi.fn() };

	return { kind: 'audio', stop: vi.fn(), clone: vi.fn(() => copy), addEventListener: vi.fn(), copy };
};

describe('the copy of the microphone used by the volume meter', () => {
	beforeEach(() => {
		vi.stubGlobal('MediaStream', class { addTrack(): void { /* fake */ } });
	});
	afterEach(() => vi.unstubAllGlobals());

	it('is released when the microphone is switched and when it stops', async () => {
		const sender = new MediaSender({} as never, new EventEmitter() as never, 'mic');
		const first = fakeTrack();
		const second = fakeTrack();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const internals = sender as any;

		internals.producerOptions = { track: first };
		internals.maybeAddHark();
		sender.running = true;

		const firstWatcher = sender.volumeWatcher;
		const replaced = vi.fn();

		sender.on('trackReplaced', replaced);
		await sender.replaceTrack(second as never);

		expect(replaced).toHaveBeenCalledTimes(1);
		expect(first.copy.stop).toHaveBeenCalled();
		expect(firstWatcher?.hark.stop).toHaveBeenCalled();
		expect(sender.volumeWatcher).not.toBe(firstWatcher);
		expect(second.copy.stop).not.toHaveBeenCalled();

		const secondWatcher = sender.volumeWatcher;

		sender.stop();

		expect(second.copy.stop).toHaveBeenCalled();
		expect(secondWatcher?.hark.stop).toHaveBeenCalled();
		expect(sender.volumeWatcher).toBeUndefined();
	});
});

describe('muting a sender', () => {
	it('is announced, so a local recording can leave muted audio out', () => {
		const sender = new MediaSender({} as never, new EventEmitter() as never, 'mic');
		const changes: Array<[ string, boolean ]> = [];

		sender.running = true;
		sender.on('paused', () => changes.push([ 'paused', sender.paused ]));
		sender.on('resumed', () => changes.push([ 'resumed', sender.paused ]));
		sender.pause();
		sender.resume();

		expect(changes).toEqual([ [ 'paused', true ], [ 'resumed', false ] ]);
	});

	it('does nothing while the sender is stopped, so a later start is not silently paused', () => {
		const sender = new MediaSender({} as never, new EventEmitter() as never, 'mic');
		const paused = vi.fn();

		sender.on('paused', paused);
		sender.pause();

		expect(sender.paused).toBe(false);
		expect(paused).not.toHaveBeenCalled();
	});
});

describe('starting a sender paused', () => {
	beforeEach(() => {
		vi.stubGlobal('MediaStream', class { addTrack(): void { /* fake */ } });
	});
	afterEach(() => vi.unstubAllGlobals());

	it('sends a disabled copy and pauses the producer, so no audio leaves before the pause', async () => {
		const producer = {
			id: 'p1',
			observer: new EventEmitter(),
			pause: vi.fn(),
			resume: vi.fn(),
			close: vi.fn(),
			appData: {},
			rtpParameters: { codecs: [] },
		};
		const produce = vi.fn(async () => producer);
		const mediaService = {
			transportsReady: Promise.resolve(),
			sendTransport: { produce },
			sendRtpCapabilities: { codecs: [] },
		};
		const sender = new MediaSender(mediaService as never, new EventEmitter() as never, 'mic');
		const copy = { kind: 'audio', enabled: true, stop: vi.fn() };
		const track = { kind: 'audio', stop: vi.fn(), clone: vi.fn(() => copy), addEventListener: vi.fn() };

		await sender.start({ track: track as never }, { paused: true });

		expect(produce).toHaveBeenCalledWith(expect.objectContaining({ track: expect.objectContaining({ enabled: false }) }));
		expect(producer.pause).toHaveBeenCalled();
		expect(sender.paused).toBe(true);
	});
});

describe('switching or closing a sender', () => {
	beforeEach(() => {
		vi.stubGlobal('MediaStream', class { addTrack(): void { /* fake */ } });
	});
	afterEach(() => vi.unstubAllGlobals());

	it('keeps the old track and stops the new one when the producer refuses it', async () => {
		const sender = new MediaSender({} as never, new EventEmitter() as never, 'mic');
		const first = fakeTrack();
		const second = fakeTrack();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const internals = sender as any;
		const replaced = vi.fn();

		internals.producerOptions = { track: first };
		internals.maybeAddHark();
		internals.producer = { replaceTrack: vi.fn(async () => { throw new Error('closed'); }) };
		sender.running = true;

		const watcher = sender.volumeWatcher;

		sender.on('trackReplaced', replaced);

		await expect(sender.replaceTrack(second as never)).rejects.toThrow('closed');
		expect(second.stop).toHaveBeenCalled();
		expect(first.stop).not.toHaveBeenCalled();
		expect(sender.track).toBe(first);
		expect(sender.volumeWatcher).toBe(watcher);
		expect(replaced).not.toHaveBeenCalled();
	});

	it('reports the stopped track when it is closed from outside, and forgets the producer', () => {
		const sender = new MediaSender({} as never, new EventEmitter() as never, 'webcam');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const internals = sender as any;
		const closed = vi.fn();

		internals.producerOptions = { track: { id: 'camera-track', kind: 'video', stop: vi.fn() } };
		internals.producer = { appData: {}, close: vi.fn() };
		sender.running = true;
		sender.on('closed', closed);
		sender.stop(false);

		expect(closed).toHaveBeenCalledWith('camera-track');
		expect(sender.producer).toBeUndefined();
	});
});

describe('a start that something else interrupts', () => {
	beforeEach(() => {
		vi.stubGlobal('MediaStream', class { addTrack(): void { /* fake */ } });
	});
	afterEach(() => vi.unstubAllGlobals());

	const startWith = (produce: () => Promise<unknown>) => {
		const mediaService = {
			transportsReady: Promise.resolve(),
			sendTransport: { produce: vi.fn(produce) },
			sendRtpCapabilities: { codecs: [] },
		};
		const sender = new MediaSender(mediaService as never, new EventEmitter() as never, 'mic');
		const copy = { kind: 'audio', enabled: true, stop: vi.fn() };
		const track = { kind: 'audio', stop: vi.fn(), clone: vi.fn(() => copy), addEventListener: vi.fn() };

		return { sender, track };
	};

	it('ends quietly when a reconnect stopped the sender, so the reconnect can start it again', async () => {
		const current: { sender?: MediaSender } = {};
		const started = vi.fn();
		const setup = startWith(async () => {
			current.sender?.stop();
			throw new Error('transport closed');
		});
		const { sender } = setup;

		current.sender = sender;
		sender.on('started', started);

		await expect(sender.start({ track: setup.track as never }, { paused: true })).resolves.toBeUndefined();
		expect(started).not.toHaveBeenCalled();
		expect(sender.running).toBe(false);
	});

	it('sends audio when it was unmuted while a muted start was still running', async () => {
		const current: { sender?: MediaSender } = {};
		const producer = {
			id: 'p1',
			paused: true,
			observer: new EventEmitter(),
			pause: vi.fn(),
			resume: vi.fn(),
			close: vi.fn(),
			appData: {},
			rtpParameters: { codecs: [] },
		};
		const setup = startWith(async () => {
			current.sender?.resume();

			return producer;
		});
		const { sender } = setup;

		current.sender = sender;
		await sender.start({ track: setup.track as never }, { paused: true });

		expect(producer.resume).toHaveBeenCalled();
		expect(producer.pause).not.toHaveBeenCalled();
		expect(sender.paused).toBe(false);
	});
});
