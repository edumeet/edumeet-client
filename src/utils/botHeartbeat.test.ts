import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOT_HEARTBEAT_MS, botHeartbeat, botHeartbeatWanted, edumeetBotApi } from './botHeartbeat';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('the heartbeat a bot page sends by itself', () => {
	it('reports running at once and then at a steady pace, well inside the 90 s the room server allows', () => {
		const send = vi.fn();
		const heartbeat = botHeartbeat(send);

		heartbeat.start();
		expect(send).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(BOT_HEARTBEAT_MS * 3);
		expect(send).toHaveBeenCalledTimes(4);
		expect(BOT_HEARTBEAT_MS).toBeLessThanOrEqual(30_000);
	});

	it('stops while the page is out of the room, and starts again when it is back', () => {
		const send = vi.fn();
		const heartbeat = botHeartbeat(send);

		heartbeat.start();
		heartbeat.stop();
		vi.advanceTimersByTime(BOT_HEARTBEAT_MS * 3);
		expect(send).toHaveBeenCalledTimes(1);

		heartbeat.start();
		expect(send).toHaveBeenCalledTimes(2);
	});

	it('does not run twice when started twice', () => {
		const send = vi.fn();
		const heartbeat = botHeartbeat(send);

		heartbeat.start();
		heartbeat.start();
		vi.advanceTimersByTime(BOT_HEARTBEAT_MS);
		expect(send).toHaveBeenCalledTimes(2);
	});

	it('is left to the provider for good once the provider reports running itself', () => {
		const send = vi.fn();
		const heartbeat = botHeartbeat(send);

		heartbeat.start();
		heartbeat.handOver();
		vi.advanceTimersByTime(BOT_HEARTBEAT_MS * 3);
		expect(send).toHaveBeenCalledTimes(1);

		// a page that leaves and rejoins does not take it back
		heartbeat.stop();
		heartbeat.start();
		vi.advanceTimersByTime(BOT_HEARTBEAT_MS * 3);
		expect(send).toHaveBeenCalledTimes(1);
	});
});

describe('window.edumeetBot on a bot page', () => {
	it('passes every report on, and says whether it went out', () => {
		const heartbeat = botHeartbeat(vi.fn());
		const send = vi.fn(() => true);
		const api = edumeetBotApi(heartbeat, send);

		expect(api.status('failed', 'ingest down', 'streamer')).toBe(true);
		expect(send).toHaveBeenCalledWith('failed', 'ingest down', 'streamer');

		send.mockReturnValueOnce(false);
		expect(api.status('finished')).toBe(false);
	});

	it('takes the heartbeat over from the page when the provider reports running itself', () => {
		const beat = vi.fn();
		const heartbeat = botHeartbeat(beat);
		const api = edumeetBotApi(heartbeat, vi.fn(() => true));

		heartbeat.start();
		api.status('running');
		vi.advanceTimersByTime(BOT_HEARTBEAT_MS * 3);

		expect(beat).toHaveBeenCalledTimes(1);
	});

	it('leaves the heartbeat with the page when the provider only reports an end or a failure', () => {
		const beat = vi.fn();
		const heartbeat = botHeartbeat(beat);
		const api = edumeetBotApi(heartbeat, vi.fn(() => true));

		heartbeat.start();
		api.status('failed', 'ingest down', 'streamer');
		api.status('finished', undefined, 'transcriber');
		vi.advanceTimersByTime(BOT_HEARTBEAT_MS);

		expect(beat).toHaveBeenCalledTimes(2);
	});
});

describe('when the page beats', () => {
	const page = { headless: true, botId: 'b1', state: 'joined', entered: true };

	it('is once the room server has taken the join of a bot page that runs jobs', () => {
		expect(botHeartbeatWanted(page)).toBe(true);
	});

	it('is not while the room is only ready, nor before, in the lobby or after leaving', () => {
		expect(botHeartbeatWanted({ ...page, entered: false })).toBe(false);
		expect(botHeartbeatWanted({ ...page, entered: undefined })).toBe(false);
		for (const state of [ 'new', 'lobby', 'left' ]) expect(botHeartbeatWanted({ ...page, state })).toBe(false);
	});

	it('is never on a page that is no bot page, or a bot page without a bot id', () => {
		expect(botHeartbeatWanted({ ...page, headless: false })).toBe(false);
		expect(botHeartbeatWanted({ ...page, botId: undefined })).toBe(false);
	});
});
