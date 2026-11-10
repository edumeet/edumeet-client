import EventEmitter from 'events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SignalingService } from './signalingService';

import { MediaService } from './mediaService';

vi.mock('@observertc/client-monitor-js', () => ({}));
vi.mock('../store/store', () => ({}));
vi.mock('../utils/edumeetConfig', () => ({ default: { theme: {} } }));

class FakeRecognition {
	public continuous = false;
	public interimResults = false;
	public onend?: () => void;
	public onresult?: unknown;
	public onerror?: unknown;
	public start = vi.fn();
	public stop = vi.fn();
}

type FakeProducer = { id: string; closed: boolean; close: () => void; send: () => void };

const setup = () => {
	const signalingService = Object.assign(new EventEmitter(), { notify: vi.fn(), sendRequest: vi.fn() });
	const mediaService = new MediaService({ signalingService: signalingService as unknown as SignalingService });
	const produced: FakeProducer[] = [];
	const recognitions: FakeRecognition[] = [];

	vi.stubGlobal('window', {
		webkitSpeechRecognition: class extends FakeRecognition {
			constructor() {
				super();
				recognitions.push(this);
			}
		}
	});

	vi.spyOn(mediaService, 'produceData').mockImplementation(async () => {
		const producer: FakeProducer = {
			id: `dp-${produced.length}`,
			closed: false,
			close() {
				this.closed = true;
			},
			send: vi.fn(),
		};

		(mediaService as unknown as { dataProducers: Map<string, FakeProducer> }).dataProducers.set(producer.id, producer);
		produced.push(producer);

		return producer as unknown as Awaited<ReturnType<MediaService['produceData']>>;
	});

	return { mediaService, signalingService, produced, recognitions };
};

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('browser transcription', () => {
	it('closes its data producer, also on the server, when stopped', async () => {
		const { mediaService, signalingService, produced } = setup();

		await mediaService.startTranscription();
		mediaService.stopTranscription();

		expect(produced[0].closed).toBe(true);
		expect(signalingService.notify).toHaveBeenCalledWith('closeDataProducer', { dataProducerId: 'dp-0' });
	});

	it('leaves no data producer open after starting and stopping again and again', async () => {
		const { mediaService, signalingService, produced } = setup();

		for (let i = 0; i < 3; i++) {
			await mediaService.startTranscription();
			mediaService.stopTranscription();
		}

		expect(produced).toHaveLength(3);
		expect(produced.every((p) => p.closed)).toBe(true);
		expect(signalingService.notify).toHaveBeenCalledTimes(3);
	});

	it('stops when the media connection is closed for a reconnect, and can be started again', async () => {
		const { mediaService, produced, recognitions } = setup();
		const stopped = vi.fn();

		mediaService.on('transcriptionStopped', stopped);

		await mediaService.startTranscription();
		mediaService.close();

		expect(recognitions[0].stop).toHaveBeenCalled();
		expect(produced[0].closed).toBe(true);
		expect(stopped).toHaveBeenCalledTimes(1);

		await mediaService.startTranscription();
		expect(recognitions).toHaveLength(2);
	});

	it('restarts recognition after the browser pauses it and keeps the data producer', async () => {
		const { mediaService, produced, recognitions } = setup();

		await mediaService.startTranscription();
		recognitions[0].onend?.();

		expect(recognitions[0].start).toHaveBeenCalledTimes(2);
		expect(produced[0].closed).toBe(false);
	});
});
