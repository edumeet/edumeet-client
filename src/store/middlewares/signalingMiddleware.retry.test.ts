import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('../../utils/RoomServerConnection', () => ({ RoomServerConnection: { create } }));
vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, askForMediaOnJoin: true, simulcast: true, simulcastSharing: true, browserWarnings: [] } }));
vi.mock('../../utils/deviceInfo', () => ({ deviceInfo: () => ({ name: 'test', version: '1', platform: 'test' }) }));
vi.mock('../../services/mediaService', () => ({}));
vi.mock('../store', () => ({}));
vi.mock('../actions/roomActions', () => ({ leaveRoom: vi.fn(() => ({ type: 'leaveRoom' })), reconnectRoom: vi.fn(() => ({ type: 'reconnectRoom' })) }));
vi.mock('../../components/translated/translatedComponents', () => ({ roomServerConnectionError: () => 'error', signalingReconnectingLabel: () => 'reconnecting' }));

import createSignalingMiddleware from './signalingMiddleware';
import { signalingActions } from '../slices/signalingSlice';
import { roomActions } from '../slices/roomSlice';
import { BOT_RETRY_INTERVAL_MS } from '../../utils/botJobs';

type MiddlewareInput = Parameters<typeof createSignalingMiddleware>[0];
type ApiInput = Parameters<ReturnType<typeof createSignalingMiddleware>>[0];
// eslint-disable-next-line no-unused-vars
type Listener = (...args: unknown[]) => void;

const setup = () => {
	const listeners = new Map<string, Listener[]>();
	const emit = (event: string) => (listeners.get(event) ?? []).forEach((listener) => listener());
	const signalingService = {
		on: vi.fn((event: string, listener: Listener) => listeners.set(event, [ ...(listeners.get(event) ?? []), listener ])),
		addConnection: vi.fn(),
		removeAllListeners: vi.fn(() => listeners.clear()),
		// closing the connections is what makes the service say `close`
		disconnect: vi.fn(() => emit('close')),
	};
	const dispatch = vi.fn();
	const middleware = createSignalingMiddleware({ signalingService, mediaService: {} } as unknown as MiddlewareInput);
	const invoke = middleware({ dispatch, getState: () => ({ signaling: { url: 'wss://x', state: 'connected' }, me: { botToken: 'secret' } }) } as unknown as ApiInput)(vi.fn());

	return { invoke, emit, dispatch, signalingService, listeners, calls: () => dispatch.mock.calls.map(([ action ]) => action) };
};

beforeEach(() => {
	vi.useFakeTimers();
	create.mockReset();
	create.mockImplementation(async () => ({ connection: create.mock.calls.length }));
});

afterEach(() => {
	vi.useRealTimers();
});

describe('signalingMiddleware', () => {
	it('opens one connection on connect, with the bot token in the handshake and not in the url', async () => {
		const { invoke, signalingService } = setup();

		invoke(signalingActions.connect());
		await vi.advanceTimersByTimeAsync(0);

		expect(create).toHaveBeenCalledTimes(1);
		expect(create.mock.calls[0][0].getUrl()).toBe('wss://x');
		expect(create.mock.calls[0][0].getAuth()).toEqual({ botToken: 'secret' });
		expect(signalingService.addConnection).toHaveBeenCalledTimes(1);
	});

	it('leaves the room when the connection closes', async () => {
		const { invoke, emit, calls } = setup();

		invoke(signalingActions.connect());
		emit('close');

		expect(calls()).toEqual([ roomActions.setLeaveReason('connectionClosed'), { type: 'leaveRoom' } ]);
	});

	it('on a retry drops the connection without leaving, and opens a new one after the interval', async () => {
		const { invoke, calls, signalingService, listeners } = setup();

		invoke(signalingActions.connect());
		await vi.advanceTimersByTimeAsync(0);

		const registered = [ ...listeners.values() ].flat().length;

		invoke(signalingActions.retry());

		expect(signalingService.disconnect).toHaveBeenCalledTimes(1);
		expect(calls()).toEqual([]);
		expect(create).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(BOT_RETRY_INTERVAL_MS - 1);
		expect(create).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1);
		expect(create).toHaveBeenCalledTimes(2);
		expect(signalingService.addConnection).toHaveBeenCalledTimes(2);

		// every listener stays, and none is added a second time
		expect(signalingService.removeAllListeners).not.toHaveBeenCalled();
		expect([ ...listeners.values() ].flat()).toHaveLength(registered);
	});

	it('leaves the room as usual when the connection made by a retry closes later', async () => {
		const { invoke, emit, calls } = setup();

		invoke(signalingActions.connect());
		invoke(signalingActions.retry());
		await vi.advanceTimersByTimeAsync(BOT_RETRY_INTERVAL_MS);
		emit('close');

		expect(calls()).toEqual([ roomActions.setLeaveReason('connectionClosed'), { type: 'leaveRoom' } ]);
	});

	it('does not come back when the page leaves while it waits to try again', async () => {
		const { invoke } = setup();

		invoke(signalingActions.connect());
		await vi.advanceTimersByTimeAsync(0);
		invoke(signalingActions.retry());
		invoke(signalingActions.disconnect());
		await vi.advanceTimersByTimeAsync(BOT_RETRY_INTERVAL_MS * 2);

		expect(create).toHaveBeenCalledTimes(1);
	});

	it('opens one connection, not two, when a second retry comes before the first has fired', async () => {
		const { invoke } = setup();

		invoke(signalingActions.connect());
		await vi.advanceTimersByTimeAsync(0);
		invoke(signalingActions.retry());
		await vi.advanceTimersByTimeAsync(1000);
		invoke(signalingActions.retry());
		await vi.advanceTimersByTimeAsync(BOT_RETRY_INTERVAL_MS * 2);

		expect(create).toHaveBeenCalledTimes(2);
	});

	it('removes the listeners before it closes the connection on a disconnect, so leaving says nothing twice', () => {
		const { invoke, calls, signalingService } = setup();

		invoke(signalingActions.connect());
		invoke(signalingActions.disconnect());

		expect(signalingService.removeAllListeners.mock.invocationCallOrder[0]).toBeLessThan(signalingService.disconnect.mock.invocationCallOrder[0]);
		expect(calls()).toEqual([]);
	});
});
