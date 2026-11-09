import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line no-unused-vars
type Handler = (event: Record<string, unknown>) => void;

type WorkerScope = {
	postMessage: ReturnType<typeof vi.fn>;
	onmessage?: Handler;
	onrtctransform?: Handler;
};

// The worker installs its handlers on its global scope when it is loaded, so each test loads a
// fresh copy against a stand-in scope.
const load = async (): Promise<WorkerScope> => {
	const scope: WorkerScope = { postMessage: vi.fn() };

	vi.stubGlobal('self', scope);
	vi.resetModules();
	await import('./sframeWorker');

	return scope;
};

const attachReceiver = (scope: WorkerScope) => {
	const transformer = {
		options: { operation: 'decrypt', codec: 'vp8', tid: 1 },
		readable: new ReadableStream(),
		writable: new WritableStream(),
		sendKeyFrameRequest: vi.fn(async () => undefined),
	};

	scope.onrtctransform?.({ transformer });

	return transformer;
};

const key = (keyId: number, fill: number) => ({ keyId, key: {}, raw: new Uint8Array(32).fill(fill) });

const decKeys = (scope: WorkerScope, keys: ReturnType<typeof key>[]): void => scope.onmessage?.({ data: { type: 'decKeys', keys } });

describe('sframe worker', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('asks senders for a keyframe only when a batch brings key material it did not hold', async () => {
		const scope = await load();
		const receiver = attachReceiver(scope);

		decKeys(scope, [ key(0x101, 1), key(0x201, 2) ]);
		expect(receiver.sendKeyFrameRequest).toHaveBeenCalledTimes(1);

		decKeys(scope, [ key(0x101, 1), key(0x201, 2) ]);
		expect(receiver.sendKeyFrameRequest).toHaveBeenCalledTimes(1);

		decKeys(scope, [ key(0x102, 3), key(0x201, 2) ]);
		expect(receiver.sendKeyFrameRequest).toHaveBeenCalledTimes(2);

		decKeys(scope, [ key(0x102, 4), key(0x201, 2) ]);
		expect(receiver.sendKeyFrameRequest).toHaveBeenCalledTimes(3);
	});

	it('asks again once a dropped sender comes back with the same keys', async () => {
		const scope = await load();
		const receiver = attachReceiver(scope);

		decKeys(scope, [ key(0x101, 1) ]);
		scope.onmessage?.({ data: { type: 'dropKeys', namespace: 1 } });
		decKeys(scope, [ key(0x101, 1) ]);

		expect(receiver.sendKeyFrameRequest).toHaveBeenCalledTimes(2);
	});
});
