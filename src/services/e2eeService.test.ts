import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/deviceInfo', () => ({
	browserInfo: { getEngineName: () => 'test', getBrowserName: () => 'test', getBrowserVersion: () => '0' },
}));

import { E2eeService } from './e2eeService';
import { MlsKeyProvider } from '../utils/e2ee/MlsKeyProvider';

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

// A member alone in its group, with the first epoch's keys applied and the sender key switched.
const enabledService = async () => {
	const service = new E2eeService();
	const provider = await service.enableMls('me');

	await provider.found('room');
	await service.applyEpochKeys();
	await vi.advanceTimersByTimeAsync(300);

	const [ enc, dec ] = FakeWorker.instances;

	return { service, provider, enc, dec };
};

// Two members of one group, both with the epoch that holds them applied.
const group = async () => {
	const alice = new E2eeService();
	const bob = new E2eeService();
	const a = await alice.enableMls('alice');
	const b = await bob.enableMls('bob');
	const pending = await b.joinExternal(await a.found('room'));

	b.accept(pending);
	await a.applyCommit(pending.commit);
	await alice.applyEpochKeys();
	await bob.applyEpochKeys();
	await vi.advanceTimersByTimeAsync(300);

	const [ aliceEnc, aliceDec, bobEnc, bobDec ] = FakeWorker.instances;

	return { alice, bob, a, b, aliceEnc, aliceDec, bobEnc, bobDec };
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
		it('starts two workers and hands the encrypt worker the first epoch key', async () => {
			const { service, provider, enc, dec } = await enabledService();
			const [ first ] = enc.postedOfType('encKey');

			expect(service.enabled).toBe(true);
			expect(FakeWorker.instances).toHaveLength(2);
			expect((first.keyId as number) >>> 8).toBe(provider.myLeafIndex);
			expect((first.keyId as number) & 0xff).toBe(0);
			expect(dec.postedOfType('decKeys')).toHaveLength(1);
			expect((dec.postedOfType('decKeys')[0].keys as unknown[])).toHaveLength(0);
		});

		it('keeps its provider and workers for the same peer id', async () => {
			const { service, provider } = await enabledService();

			expect(await service.enableMls('me')).toBe(provider);
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

		it('holds a sender until the first key is switched to', async () => {
			const service = new E2eeService();
			const provider = await service.enableMls('me');

			await provider.found('room');
			await service.applyEpochKeys();

			const held = service.protectSender(sender(), 'video/vp8');

			expect(await settled(held)).toBe(false);

			await vi.advanceTimersByTimeAsync(300);

			expect(await settled(held)).toBe(true);
		});
	});

	describe('members', () => {
		it('hands the decrypt worker the other member\'s key under its leaf index', async () => {
			const { aliceDec, b } = await group();
			const latest = aliceDec.postedOfType('decKeys').at(-1)!;
			const [ delivered ] = latest.keys as Array<Record<string, unknown>>;

			expect((delivered.keyId as number) >>> 8).toBe(b.myLeafIndex);
			expect((delivered.key as CryptoKey).algorithm.name).toBe('AES-GCM');
			expect((delivered.raw as Uint8Array).length).toBe(32);
		});

		it('asks for a key only for a namespace that belongs to a member', async () => {
			const { alice, aliceDec, b } = await group();
			const needed = vi.fn();

			alice.onKeyNeeded = needed;

			diag(aliceDec, 'keyNeeded', { namespace: b.myLeafIndex });
			expect(needed).toHaveBeenCalledWith('bob');

			diag(aliceDec, 'keyNeeded', { namespace: 0x123456 });
			expect(needed).toHaveBeenCalledTimes(1);

			alice.removePeer('bob');
			diag(aliceDec, 'keyNeeded', { namespace: b.myLeafIndex });

			expect(needed).toHaveBeenCalledTimes(1);
			expect(aliceDec.postedOfType('dropKeys')).toEqual([ { type: 'dropKeys', namespace: b.myLeafIndex } ]);
		});

		it('drops the keys of a member the next epoch no longer holds', async () => {
			const { alice, a, aliceDec, b } = await group();
			const removal = await a.commitRemove([ 'bob' ]);

			a.accept(removal!);
			await alice.applyEpochKeys();

			expect(aliceDec.postedOfType('dropKeys')).toEqual([ { type: 'dropKeys', namespace: b.myLeafIndex } ]);
		});
	});

	describe('data channel messages', () => {
		const text = new TextEncoder();
		const utf8 = new TextDecoder();

		it('seals and opens nothing while encryption is off', async () => {
			const service = new E2eeService();

			expect(await service.sealMessage(text.encode('hi'))).toBeUndefined();
			expect(await service.openMessage(new Uint8Array(64))).toBeUndefined();
		});

		it('is read by the other member, and by nobody outside the epoch', async () => {
			const { alice, bob } = await group();
			const sealed = await alice.sealMessage(text.encode('hello bob'));

			expect(utf8.decode(await bob.openMessage(sealed!))).toBe('hello bob');
			expect(await alice.openMessage(sealed!)).toBeUndefined();

			const { service: stranger } = await enabledService();

			expect(await stranger.openMessage(sealed!)).toBeUndefined();
		});

		it('moves to the new epoch key with the sender, and still reads the previous one', async () => {
			const { alice, bob, a, b } = await group();
			const before = await alice.sealMessage(text.encode('before'));
			const update = await a.commitUpdate();

			a.accept(update);
			await b.applyCommit(update.commit);
			await alice.applyEpochKeys();
			await bob.applyEpochKeys();
			await vi.advanceTimersByTimeAsync(300);

			const after = await alice.sealMessage(text.encode('after'));

			// Epoch 0 was founded, 1 added bob, 2 is the update.
			expect(new DataView(after!.buffer).getUint32(0) & 0xff).toBe(2);
			expect(utf8.decode(await bob.openMessage(after!))).toBe('after');
			expect(utf8.decode(await bob.openMessage(before!))).toBe('before');
		});

		it('stops reading a member that left', async () => {
			const { alice, bob } = await group();
			const sealed = await alice.sealMessage(text.encode('hello bob'));

			bob.removePeer('alice');

			expect(await bob.openMessage(sealed!)).toBeUndefined();
		});

		it('waits for the first key like a sender does', async () => {
			const service = new E2eeService();
			const provider = await service.enableMls('me');

			await provider.found('room');
			await service.applyEpochKeys();

			const held = service.sealMessage(text.encode('early'));

			expect(await settled(held)).toBe(false);

			await vi.advanceTimersByTimeAsync(300);

			expect(await held).toBeDefined();
		});
	});

	describe('epoch keys', () => {
		it('hands receivers their keys at once and lets the sender switch after a pause', async () => {
			const service = new E2eeService();
			const provider = await service.enableMls('me');
			const [ enc, dec ] = FakeWorker.instances;

			await provider.found('room');
			await service.applyEpochKeys();

			const held = service.protectSender(sender(), 'video/vp8');

			expect(dec.postedOfType('decKeys')).toHaveLength(1);
			expect(enc.postedOfType('encKey')).toHaveLength(0);
			expect(await settled(held)).toBe(false);

			await vi.advanceTimersByTimeAsync(300);

			expect(enc.postedOfType('encKey')).toHaveLength(1);
			expect(await settled(held)).toBe(true);

			provider.accept(await provider.commitUpdate());
			await service.applyEpochKeys();
			provider.accept(await provider.commitUpdate());
			await service.applyEpochKeys();

			expect(dec.postedOfType('decKeys')).toHaveLength(3);
			expect(enc.postedOfType('encKey')).toHaveLength(1);

			await vi.advanceTimersByTimeAsync(300);

			const pushed = enc.postedOfType('encKey');

			expect(pushed).toHaveLength(2);
			expect((pushed[1].keyId as number) & 0xff).toBe(2);
		});

		it('switches within half a second of the first commit of a burst, with the newest key', async () => {
			const service = new E2eeService();
			const provider = await service.enableMls('me');
			const [ enc ] = FakeWorker.instances;

			await provider.found('room');
			await service.applyEpochKeys();
			await vi.advanceTimersByTimeAsync(300);

			expect(enc.postedOfType('encKey')).toHaveLength(1);

			provider.accept(await provider.commitUpdate());
			await service.applyEpochKeys();
			await vi.advanceTimersByTimeAsync(200);
			provider.accept(await provider.commitUpdate());
			await service.applyEpochKeys();
			await vi.advanceTimersByTimeAsync(200);
			provider.accept(await provider.commitUpdate());
			await service.applyEpochKeys();
			await vi.advanceTimersByTimeAsync(80);

			expect(enc.postedOfType('encKey')).toHaveLength(1);

			await vi.advanceTimersByTimeAsync(40);

			const pushed = enc.postedOfType('encKey');

			expect(pushed).toHaveLength(2);
			expect((pushed[1].keyId as number) & 0xff).toBe(3);
		});

		it('pushes the epoch keys, and keeps pushing after one application failed', async () => {
			const service = new E2eeService();
			const provider = await service.enableMls('me');
			const [ enc, dec ] = FakeWorker.instances;

			await provider.found('room');

			vi.spyOn(MlsKeyProvider.prototype, 'frameKeys').mockRejectedValueOnce(new Error('boom'));

			await expect(service.applyEpochKeys()).rejects.toThrow('boom');
			expect(dec.postedOfType('decKeys')).toHaveLength(0);

			await service.applyEpochKeys();
			await vi.advanceTimersByTimeAsync(300);

			expect(enc.postedOfType('encKey')).toHaveLength(1);
			expect(dec.postedOfType('decKeys')).toHaveLength(1);
			expect(service.enabled).toBe(true);
		});
	});
});
