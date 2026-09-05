import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/deviceInfo', () => ({
	browserInfo: { getEngineName: () => 'test', getBrowserName: () => 'test', getBrowserVersion: () => '0' },
}));

import { E2eeService } from './e2eeService';
import { WebCryptoKeyProvider } from '../utils/e2ee/WebCryptoKeyProvider';
import { peerNamespace } from '../utils/e2ee/crypto';

// eslint-disable-next-line no-unused-vars
type Listener = (e: MessageEvent) => void;

class FakeWorker {
	static instances: FakeWorker[] = [];
	onmessage: Listener | null = null;
	readonly posted: Array<Record<string, unknown>> = [];

	constructor() {
		FakeWorker.instances.push(this);
	}

	postMessage(message: Record<string, unknown>): void {
		this.posted.push(message);
	}

	emit(data: Record<string, unknown>): void {
		this.onmessage?.({ data } as unknown as MessageEvent);
	}

	postedOfType(type: string): Array<Record<string, unknown>> {
		return this.posted.filter((m) => m.type === type);
	}
}

class FakeTransform {
	static instances: FakeTransform[] = [];
	readonly worker: FakeWorker;
	readonly options: Record<string, unknown>;

	constructor(worker: FakeWorker, options: Record<string, unknown>) {
		this.worker = worker;
		this.options = options;
		FakeTransform.instances.push(this);
	}
}

const diag = (worker: FakeWorker, event: string, extra: Record<string, unknown> = {}): void =>
	worker.emit({ type: 'e2eeDiag', level: 'debug', event, ...extra });

const sender = (): RTCRtpSender => ({} as unknown as RTCRtpSender);
const receiver = (): RTCRtpReceiver => ({} as unknown as RTCRtpReceiver);

const enabledService = async () => {
	const service = new E2eeService();

	await service.enable('me');

	const [ enc, dec ] = FakeWorker.instances;

	return { service, enc, dec };
};

// Whether a promise has settled, without waiting on it: the waiters here must stay pending until
// their own confirmation arrives, and a pending promise cannot be asserted on by awaiting it.
const settled = async (p: Promise<unknown>): Promise<boolean> => {
	let done = false;

	void p.then(() => { done = true; }, () => { done = true; });
	await vi.advanceTimersByTimeAsync(0);

	return done;
};

describe('E2EE service', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		FakeWorker.instances = [];
		FakeTransform.instances = [];
		vi.stubGlobal('Worker', FakeWorker);
		vi.stubGlobal('RTCRtpScriptTransform', FakeTransform);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	describe('enabling', () => {
		it('starts two workers and hands the encrypt worker the initial key', async () => {
			const { service, enc, dec } = await enabledService();
			const [ first ] = enc.postedOfType('encKey');

			expect(service.enabled).toBe(true);
			expect(FakeWorker.instances).toHaveLength(2);
			expect(first.ratcheted).toBe(false);
			expect((first.keyId as number) >>> 8).toBe(await peerNamespace('me'));
			expect((first.keyId as number) & 0xff).toBe(0);
			expect(dec.posted).toEqual([]);
		});

		it('is idempotent', async () => {
			const { service } = await enabledService();

			await service.enable('me');

			expect(FakeWorker.instances).toHaveLength(2);
		});
	});

	describe('releasing a sender', () => {
		it('needs nothing when encryption is off', async () => {
			await expect(new E2eeService().whenProtectionActive(undefined)).resolves.toBe(true);
		});

		it('refuses when encryption is on but no transform was attached', async () => {
			const { service } = await enabledService();

			await expect(service.whenProtectionActive(undefined)).resolves.toBe(false);
		});

		it('releases exactly the producer whose transform confirmed', async () => {
			const { service, enc } = await enabledService();
			const camera = await service.protectSender(sender(), 'video/VP8');
			const mic = await service.protectSender(sender(), 'audio/opus');
			const cameraReady = service.whenProtectionActive(camera);
			const micReady = service.whenProtectionActive(mic);

			diag(enc, 'pipeLive', { op: 'encrypt', id: mic });

			expect(await settled(micReady)).toBe(true);
			expect(await settled(cameraReady)).toBe(false);
			await expect(micReady).resolves.toBe(true);

			diag(enc, 'pipeLive', { op: 'encrypt', id: camera });
			await expect(cameraReady).resolves.toBe(true);
		});

		it('gives up on a transform that never confirms', async () => {
			const { service } = await enabledService();
			const tid = await service.protectSender(sender(), 'video/VP8');
			const ready = service.whenProtectionActive(tid);

			await vi.advanceTimersByTimeAsync(29999);
			expect(await settled(ready)).toBe(false);

			await vi.advanceTimersByTimeAsync(1);
			await expect(ready).resolves.toBe(false);
		});

		it('is not released by the decrypt side or by a message outside the envelope', async () => {
			const { service, enc, dec } = await enabledService();
			const tid = await service.protectSender(sender(), 'video/VP8');
			const ready = service.whenProtectionActive(tid);

			diag(dec, 'pipeLive', { op: 'decrypt', id: tid });
			enc.emit({ type: 'other', event: 'pipeLive', op: 'encrypt', id: tid });

			expect(await settled(ready)).toBe(false);
		});
	});

	describe('watchdog', () => {
		it('arms only once a transform is attached and media can flow, then fires once', async () => {
			const { service } = await enabledService();
			const unverified = vi.fn();

			service.onEncryptionUnverified = unverified;

			service.notifyMediaFlowPossible();
			await vi.advanceTimersByTimeAsync(3000);
			expect(unverified).not.toHaveBeenCalled();

			await service.protectSender(sender(), 'video/VP8');
			await vi.advanceTimersByTimeAsync(2999);
			expect(unverified).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(1);
			expect(unverified).toHaveBeenCalledTimes(1);

			await vi.advanceTimersByTimeAsync(10000);
			expect(unverified).toHaveBeenCalledTimes(1);
		});

		it('does not arm for a receive only participant', async () => {
			const { service } = await enabledService();
			const unverified = vi.fn();

			service.onEncryptionUnverified = unverified;
			await service.protectReceiver(receiver(), 'video/VP8');
			service.notifyMediaFlowPossible();
			await vi.advanceTimersByTimeAsync(10000);

			expect(unverified).not.toHaveBeenCalled();
		});

		it('is cancelled by the first confirmed encryption', async () => {
			const { service, enc } = await enabledService();
			const unverified = vi.fn();

			service.onEncryptionUnverified = unverified;

			const tid = await service.protectSender(sender(), 'video/VP8');

			service.notifyMediaFlowPossible();
			await vi.advanceTimersByTimeAsync(1000);
			diag(enc, 'pipeLive', { op: 'encrypt', id: tid });
			await vi.advanceTimersByTimeAsync(10000);

			expect(unverified).not.toHaveBeenCalled();
		});
	});

	describe('verified state', () => {
		it('is set once by a first frame in either direction', async () => {
			const { service, enc, dec } = await enabledService();
			const verified = vi.fn();

			service.onEncryptionVerified = verified;

			expect(service.encryptionVerified).toBe(false);

			diag(dec, 'firstFrame', { op: 'decrypt' });
			expect(service.encryptionVerified).toBe(true);
			expect(verified).toHaveBeenCalledTimes(1);

			diag(enc, 'firstFrame', { op: 'encrypt' });
			expect(verified).toHaveBeenCalledTimes(1);
		});
	});

	describe('attaching transforms', () => {
		it('binds encrypt to the first worker and decrypt to the second, with a normalised codec', async () => {
			const { service, enc, dec } = await enabledService();

			await service.protectSender(sender(), 'video/VP9');
			await service.protectSender(sender(), 'video/H264');
			await service.protectSender(sender(), 'audio/PCMU');
			await service.protectSender(sender(), 'video/AV1');
			await service.protectReceiver(receiver(), 'audio/opus');

			const [ vp9, h264, pcmu, av1, opus ] = FakeTransform.instances;

			expect(vp9.worker).toBe(enc);
			expect(vp9.options).toMatchObject({ operation: 'encrypt', codec: 'vp9' });
			expect(h264.options.codec).toBe('h264');
			expect(pcmu.options.codec).toBe('opus');
			expect(av1.options.codec).toBe('unknown');
			expect(opus.worker).toBe(dec);
			expect(opus.options).toMatchObject({ operation: 'decrypt', codec: 'opus' });
			expect(new Set(FakeTransform.instances.map((t) => t.options.tid)).size).toBe(5);
		});

		it('attaches nothing when disabled or when there is no target', async () => {
			expect(await new E2eeService().protectSender(sender(), 'video/VP8')).toBeUndefined();

			const { service } = await enabledService();

			expect(await service.protectSender(undefined, 'video/VP8')).toBeUndefined();
			expect(FakeTransform.instances).toHaveLength(0);
		});
	});

	describe('advancing the local key', () => {
		it('only advances once something was encrypted under the current key', async () => {
			const { service, enc } = await enabledService();
			const keyIdOf = (index: number): number => enc.postedOfType('encKey')[index].keyId as number;

			await service.ratchetLocalKey();
			expect(enc.postedOfType('encKey')).toHaveLength(1);

			diag(enc, 'encKeyUsed', { keyId: keyIdOf(0) });
			await service.ratchetLocalKey();
			expect(enc.postedOfType('encKey')).toHaveLength(2);
			expect(enc.postedOfType('encKey')[1].ratcheted).toBe(true);
			expect(keyIdOf(1) & 0xff).toBe(1);

			diag(enc, 'encKeyUsed', { keyId: keyIdOf(0) });
			await service.ratchetLocalKey();
			expect(enc.postedOfType('encKey')).toHaveLength(2);

			diag(enc, 'encKeyUsed', { keyId: keyIdOf(1) });
			await service.ratchetLocalKey();
			expect(enc.postedOfType('encKey')).toHaveLength(3);
		});

		it('replaces the key on rotate regardless and starts the count over', async () => {
			const { service, enc } = await enabledService();

			await service.rotateLocalKey();

			const [ , replaced ] = enc.postedOfType('encKey');

			expect(replaced.ratcheted).toBe(false);
			expect((replaced.keyId as number) & 0xff).toBe(1);

			await service.ratchetLocalKey();
			expect(enc.postedOfType('encKey')).toHaveLength(2);
		});
	});

	describe('peers', () => {
		it('asks for a key only for a namespace that belongs to a known peer', async () => {
			const { service, dec } = await enabledService();
			const bob = new WebCryptoKeyProvider('bob');
			const needed = vi.fn();

			await bob.init();
			await service.addPeer('bob', await bob.getIdentityPublicKey());
			service.onKeyNeeded = needed;

			const namespace = await peerNamespace('bob');

			diag(dec, 'keyNeeded', { namespace });
			expect(needed).toHaveBeenCalledWith('bob');

			diag(dec, 'keyNeeded', { namespace: 0x123456 });
			expect(needed).toHaveBeenCalledTimes(1);

			service.removePeer('bob');
			await vi.advanceTimersByTimeAsync(0);
			diag(dec, 'keyNeeded', { namespace });

			expect(needed).toHaveBeenCalledTimes(1);
			expect(dec.postedOfType('dropKeys')).toEqual([ { type: 'dropKeys', namespace } ]);
		});

		it('hands an unwrapped remote key, with its bytes, to the decrypt worker', async () => {
			const { service, dec } = await enabledService();
			const bob = new WebCryptoKeyProvider('bob');

			await bob.init();
			await bob.addPeer('me', await service.getIdentityPublicKey());
			await service.addPeer('bob', await bob.getIdentityPublicKey());

			const msg = await bob.wrapLocalKeyFor('me');

			await service.onRemoteKey('bob', msg.keyId, msg.iv, msg.data);

			const [ delivered ] = dec.postedOfType('decKey');

			expect(delivered.keyId).toBe(msg.keyId);
			expect((delivered.key as CryptoKey).algorithm.name).toBe('AES-GCM');
			expect(delivered.raw).toBeInstanceOf(Uint8Array);
			expect((delivered.raw as Uint8Array).length).toBe(32);
		});
	});

	describe('a key burned by a departure while nothing was being sent', () => {
		it('is replaced before the next producer attaches its transform', async () => {
			const { service } = await enabledService();
			const order: string[] = [];

			service.onRotateRequired = async () => {
				order.push(`rotate with ${FakeTransform.instances.length} transforms attached`);
			};
			service.markKeyBurned();

			await service.protectSender(sender(), 'audio/opus');

			expect(order).toEqual([ 'rotate with 0 transforms attached' ]);
			expect(FakeTransform.instances).toHaveLength(1);
		});

		it('is replaced once when several producers start together', async () => {
			const { service } = await enabledService();
			const rotate = vi.fn(async () => undefined);

			service.onRotateRequired = rotate;
			service.markKeyBurned();

			await Promise.all([
				service.protectSender(sender(), 'audio/opus'),
				service.protectSender(sender(), 'video/VP8'),
				service.protectSender(sender(), 'video/VP8'),
			]);

			expect(rotate).toHaveBeenCalledTimes(1);
			expect(FakeTransform.instances).toHaveLength(3);
		});

		it('does not replace an unburned key, and a replacement clears the burn', async () => {
			const { service } = await enabledService();
			const rotate = vi.fn(async () => undefined);

			service.onRotateRequired = rotate;

			await service.protectSender(sender(), 'audio/opus');
			expect(rotate).not.toHaveBeenCalled();

			service.markKeyBurned();
			await service.rotateLocalKey();
			await service.protectSender(sender(), 'video/VP8');
			expect(rotate).not.toHaveBeenCalled();
		});

		it('still replaces the key locally when nothing is wired to distribute it', async () => {
			const { service, enc } = await enabledService();

			service.markKeyBurned();
			await service.protectSender(sender(), 'audio/opus');

			const keys = enc.postedOfType('encKey');

			expect(keys).toHaveLength(2);
			expect(keys[1].ratcheted).toBe(false);
			expect((keys[1].keyId as number) & 0xff).toBe(1);
		});
	});
});
