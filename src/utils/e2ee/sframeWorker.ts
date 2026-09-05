/* eslint-disable @typescript-eslint/no-explicit-any */
// E2EE media transform worker — runs inside RTCRtpScriptTransform, off the main thread.
// Encrypts our outgoing frames with our media key; decrypts incoming frames by keyId.
// Codec-aware clear header (Phase 0, source-proven vs mediasoup): VP8 10/3, VP9 0, Opus audio 1.
// Keys arrive via postMessage (CryptoKey is structured-cloneable); never leaves the worker.

import { DecryptKeyStore } from './keyStore';
import { clearBytes, nonceFor, open, parseFrame, seal } from './frameCrypto';

// `used` records whether anything has actually been encrypted under the current key. Advancing on a
// newcomer's arrival exists to keep them from reading what came before, so it is only worth anything
// once something has been sent under the key being left behind.
const enc: { key?: CryptoKey; keyId: number; counter: number; used: boolean } = { keyId: 0, counter: 0, used: false };
const dec = new DecryptKeyStore((namespace) => report({ level: 'debug', event: 'keyNeeded', namespace }));
const encTransformers: any[] = [];
const decTransformers: any[] = [];

// ---- diagnostics -------------------------------------------------------------------------------
// Cross-engine debugging needs the byte-level facts from BOTH ends of a call: what each browser
// hands the transform, what clear/ciphertext split each side computed, and why a frame was dropped.
// Every failure path below is otherwise silent, which is what made the Firefox interop work guesswork.
// Reports go to the main thread (workers have no `debug`/localStorage) and are rate limited: the
// first few frames of each stream in full, then a rolling counter summary.
const DEBUG_FRAMES = 3;
const SUMMARY_MS = 5000;

type Diag = {
	id: number;
	op: 'encrypt' | 'decrypt';
	codec: string;
	seen: number;
	ok: number;
	// Frames too short to carry a protected payload (Opus DTX/silence). Passed through untouched
	// rather than counted as a failure: there is nothing in them to protect and nothing to drop.
	passed: number;
	drops: Record<string, number>;
	// Drops since the LAST summary. The cumulative tally above is the session total, but warning on it
	// would light up permanently after the handful of frames that arrive before a peer's key does, and
	// a warning that never clears is one nobody reads.
	windowDrops: Record<string, number>;
	windowSeen: number;
	windowOk: number;
	nextSummary: number;
};

let diagSeq = 0;

// The worker has no Logger of its own, so diagnostics go to the main thread and are emitted there
// through the app logger at debug level, like everything else.
function report(payload: Record<string, unknown>): void {
	try {
		// Envelope last: a payload key must never be able to clobber the discriminator the main
		// thread filters on, or the report is dropped without a trace.
		(self as any).postMessage({ ...payload, type: 'e2eeDiag' });
	} catch { /* diagnostics must never break media */ }
}

function hex(data: Uint8Array, n: number): string {
	return Array.from(data.subarray(0, n), (b) => b.toString(16).padStart(2, '0')).join(' ');
}

// frame.type and getMetadata() are the fields that differ between engines. We no longer USE them for
// the split, but they are the evidence for any future interop question, so record what each sees.
function frameShape(frame: any): Record<string, unknown> {
	let meta: Record<string, unknown> = {};

	try {
		const m = frame.getMetadata?.() || {};

		meta = { rid: m.rid, spatialIndex: m.spatialIndex, temporalIndex: m.temporalIndex, mimeType: m.mimeType };
	} catch { /* not all engines implement getMetadata */ }

	return { frameType: frame.type, bytes: frame.data?.byteLength, meta };
}

function drop(diag: Diag, reason: string, extra?: Record<string, unknown>): void {
	diag.drops[reason] = (diag.drops[reason] || 0) + 1;
	diag.windowDrops[reason] = (diag.windowDrops[reason] || 0) + 1;

	// Per reason, not per stream: a failure that only starts after the first few frames was invisible
	// when this was gated on the frame counter.
	if (diag.drops[reason] <= DEBUG_FRAMES) {
		report({ level: 'warn', id: diag.id, op: diag.op, codec: diag.codec, event: 'drop', reason, ...extra });
	}
}

// The sender holds real media back until this fires, so it must not require an ENCRYPTED frame: a
// disabled or silent mic emits only DTX frames, which are passed through, so keying on encryption
// would strand an audio-only participant with the track off. A handled frame proves the browser is
// feeding the transform, which is the failure this guards against, and any frame carrying content is
// encrypted by definition -- passthrough only ever applies to frames with nothing past the header.
function markHandled(diag: Diag, op: 'encrypt' | 'decrypt', codec: string): void {
	if (diag.ok + diag.passed !== 1) return;

	report({ level: 'debug', id: diag.id, op, codec, event: 'pipeLive' });
}

function tick(diag: Diag): void {
	const now = Date.now();

	if (now < diag.nextSummary) return;
	diag.nextSummary = now + SUMMARY_MS;
	const dropped = Object.values(diag.drops).reduce((a, b) => a + b, 0);
	const recentDropped = Object.values(diag.windowDrops).reduce((a, b) => a + b, 0);

	report({
		level: recentDropped > 0 ? 'warn' : 'debug',
		id: diag.id,
		op: diag.op,
		codec: diag.codec,
		event: 'summary',
		seen: diag.seen,
		ok: diag.ok,
		passed: diag.passed,
		dropped,
		recentSeen: diag.seen - diag.windowSeen,
		recentOk: diag.ok - diag.windowOk,
		recentDropped,
		recentReasons: { ...diag.windowDrops },
		reasons: { ...diag.drops }
	});

	diag.windowDrops = {};
	diag.windowSeen = diag.seen;
	diag.windowOk = diag.ok;
}

async function encrypt(frame: any, controller: any, codec: string, diag: Diag): Promise<void> {
	diag.seen++;
	if (!enc.key) return drop(diag, 'noEncKey'); // no key yet -> don't emit cleartext
	try {
		const data = new Uint8Array(frame.data);
		const header = clearBytes(data, codec);
		// A frame with nothing past the clear header (Opus DTX/silence) would be authenticated with a
		// zero-length AAD here while the receiver reads a header-length AAD, so GCM would reject every
		// one of them. Nothing in such a frame is secret, so pass it through untouched.

		if (data.length <= header) {
			diag.passed++;
			markHandled(diag, 'encrypt', codec);
			controller.enqueue(frame);
			tick(diag);

			return;
		}

		const nonce = nonceFor(enc.keyId, enc.counter++);

		if (diag.seen <= DEBUG_FRAMES) {
			report({
				level: 'debug',
				id: diag.id,
				op: 'encrypt',
				codec,
				event: 'frame',
				header,
				keyId: enc.keyId,
				plainHead: hex(data, Math.min(16, data.length)),
				...frameShape(frame)
			});
		}

		frame.data = (await seal(data, header, enc.key, nonce)).buffer;
		diag.ok++;

		if (!enc.used) {
			enc.used = true;
			report({ level: 'debug', event: 'encKeyUsed', keyId: enc.keyId });
		}

		// Proof that this stream is genuinely being encrypted, not merely that a transform was attached.
		if (diag.ok === 1) report({ level: 'debug', id: diag.id, op: 'encrypt', codec, event: 'firstFrame' });
		markHandled(diag, 'encrypt', codec);
		controller.enqueue(frame);
	} catch (error) {
		drop(diag, 'encryptThrew', { error: String(error) });
	}
	tick(diag);
}

async function decrypt(frame: any, controller: any, codec: string, diag: Diag): Promise<void> {
	diag.seen++;
	if (dec.size === 0) return drop(diag, 'noDecKeys');

	let derived = false;
	let namespace = -1;
	let keyId = 0;

	try {
		const data = new Uint8Array(frame.data);
		const shape = parseFrame(data, codec);
		const { header } = shape;

		if (shape.kind === 'passthrough') {
			diag.passed++;
			markHandled(diag, 'decrypt', codec);
			controller.enqueue(frame);
			tick(diag);

			return;
		}

		if (shape.kind === 'impossible') {
			drop(diag, 'impossibleLength', { bytes: data.length, header });
			tick(diag);

			return;
		}

		keyId = shape.keyId;
		namespace = keyId >>> 8;

		const chain = dec.has(keyId) ? undefined : await dec.deriveChain(keyId);
		const key = chain ? chain[chain.length - 1].entry.key : dec.get(keyId)?.key;

		derived = Boolean(chain);

		if (diag.seen <= DEBUG_FRAMES) {
			report({
				level: 'debug',
				id: diag.id,
				op: 'decrypt',
				codec,
				event: 'frame',
				header,
				keyId,
				haveKey: Boolean(key),
				derived,
				knownKeyIds: dec.knownKeyIds(),
				wireHead: hex(data, Math.min(16, data.length)),
				...frameShape(frame)
			});
		}

		// A keyId we hold no key for and cannot derive one for. Either the sender's key never reached
		// us, or we have fallen further behind their advances than we will derive, or this is not a
		// keyId at all because the clear byte count disagrees and we are reading ciphertext as a
		// header. The first two are recoverable and the count below is what starts that.
		if (!key) {
			dec.missed(namespace);

			return drop(diag, 'unknownKeyId', { keyId, knownKeyIds: dec.knownKeyIds(), header });
		}
		const out = await open(shape, key);

		// Authenticated, so a derived key was the right guess and is worth keeping. Anything that fails
		// past this point is not the derivation's doing, so stop attributing it to one.
		derived = false;
		dec.decrypted(namespace);
		if (chain) dec.commitChain(chain);

		frame.data = out.buffer;
		diag.ok++;
		if (diag.ok === 1) report({ level: 'debug', id: diag.id, op: 'decrypt', codec, event: 'firstFrame' });
		markHandled(diag, 'decrypt', codec);
		controller.enqueue(frame);
	} catch (error) {
		// Correct keyId but failed authentication: same key, different clear/ciphertext split.
		if (!derived) drop(diag, 'gcmAuthFailed', { error: String(error), bytes: frame.data?.byteLength, header: clearBytes(new Uint8Array(frame.data), codec) });

		// A derived key that does not authenticate means the sender replaced its key rather than
		// advancing it, which is what a departure does. Usually the replacement is already on its way,
		// so this is a short gap, and the count is there for when it is not.
		else {
			dec.deriveFailed(keyId);
			dec.missed(namespace);
			drop(diag, 'ratchetMiss', { bytes: frame.data?.byteLength });
		}
	}
	tick(diag);
}

// generateKeyFrame()/sendKeyFrameRequest() are VIDEO-ONLY and return a Promise. On audio transforms
// they reject with InvalidStateError ("kind ... is not video"); during a reconnect a video transform
// can also reject mid-teardown. Skip audio (codec 'opus') and swallow the rejection so it never
// surfaces as "Uncaught (in promise)".
function requestKeyFrames(transformers: any[], method: 'generateKeyFrame' | 'sendKeyFrameRequest'): void {
	for (const t of transformers) {
		if (t.options?.codec === 'opus') continue; // audio: no keyframes
		try {
			const r = t[method]?.();

			if (r && typeof r.catch === 'function') r.catch(() => { /* ignore (transform not ready / mid-reconnect) */ });
		} catch { /* ignore sync throw */ }
	}
}

(self as any).onmessage = (e: MessageEvent): void => {
	const m: any = e.data;

	if (m.type === 'encKey') {
		enc.key = m.key; enc.keyId = m.keyId >>> 0; enc.counter = 0; enc.used = false;
		report({ level: 'debug', event: 'encKey', keyId: enc.keyId, ratcheted: Boolean(m.ratcheted) });
		// A replaced key needs a fresh keyframe so receivers re-sync. An advanced one does not, since
		// receivers derive it and keep decoding, and forcing one per arrival would spike every camera
		// in the room at exactly the moment people are joining.
		if (!m.ratcheted) requestKeyFrames(encTransformers, 'generateKeyFrame');
	} else if (m.type === 'dropKeys') {
		dec.dropNamespace(m.namespace >>> 0);
		report({ level: 'debug', event: 'dropKeys', namespace: m.namespace >>> 0, knownKeyIds: dec.knownKeyIds() });
	} else if (m.type === 'decKey') {
		const keyId = m.keyId >>> 0;

		dec.set(keyId, { key: m.key, raw: m.raw });
		report({ level: 'debug', event: 'decKey', keyId, knownKeyIds: dec.knownKeyIds() });
		// A remote key arrived/rotated -> request a keyframe so our decoder starts clean.
		requestKeyFrames(decTransformers, 'sendKeyFrameRequest');
	}
};

// Chrome attaches the transform and then never delivers a frame, while media keeps flowing. That
// pattern fits the pipe construction below throwing after the 'attached' report, so everything here
// is instrumented: an attach failure, a pipe rejection and a transformer that never sees a frame are
// each reported instead of failing silently. Silence is the one outcome we cannot act on.
const STALL_CHECK_MS = 5000;

(self as any).onrtctransform = (event: any): void => {
	const t = event?.transformer;
	const op = t?.options?.operation;
	const codec = t?.options?.codec;
	// The main thread assigns the id so it can tell which transform a report belongs to and release
	// that specific sender. Fall back to a local counter if it ever attaches without one.
	const tid = t?.options?.tid;
	const diag: Diag = {
		id: typeof tid === 'number' ? tid : ++diagSeq,
		op,
		codec,
		seen: 0,
		ok: 0,
		passed: 0,
		drops: {},
		windowDrops: {},
		windowSeen: 0,
		windowOk: 0,
		nextSummary: 0
	};

	report({
		level: 'debug',
		id: diag.id,
		op,
		codec,
		event: 'attached',
		hasTransformStream: typeof (globalThis as any).TransformStream,
		readable: typeof t?.readable,
		writable: typeof t?.writable,
		readableLocked: t?.readable?.locked,
		optionKeys: t?.options ? Object.keys(t.options) : null
	});

	try {
		const arr = op === 'encrypt' ? encTransformers : decTransformers;

		arr.push(t);
		const ts = new (globalThis as any).TransformStream({
			transform: (frame: any, controller: any) =>
				(op === 'encrypt' ? encrypt(frame, controller, codec, diag) : decrypt(frame, controller, codec, diag)),
		});

		// A transformer that is attached but never fed is invisible without this: no frames means no
		// summary, which reads identically to the worker never having been wired up at all.
		setTimeout(() => {
			if (diag.seen > 0) return;

			report({
				level: 'warn',
				id: diag.id,
				op,
				codec,
				event: 'noFrames',
				afterMs: STALL_CHECK_MS,
				readableLocked: t?.readable?.locked,
				attachedTransformers: arr.length
			});
		}, STALL_CHECK_MS);

		// When the stream ends (sender/receiver replaced on reconnect, or peer left), drop the dead
		// transformer so the arrays don't grow and we don't poke keyframe methods on closed transforms.
		t.readable.pipeThrough(ts).pipeTo(t.writable)
			.catch((error: unknown) => report({
				level: 'warn',
				id: diag.id,
				op,
				codec,
				event: 'pipeFailed',
				error: String(error)
			}))
			.finally(() => {
				const i = arr.indexOf(t);

				if (i !== -1) arr.splice(i, 1);
				const dropped = Object.values(diag.drops).reduce((a, b) => a + b, 0);

				report({
					level: dropped > 0 ? 'warn' : 'debug',
					id: diag.id,
					op,
					codec,
					event: 'closed',
					seen: diag.seen,
					ok: diag.ok,
					dropped,
					reasons: { ...diag.drops }
				});
			});
	} catch (error) {
		report({
			level: 'warn',
			id: diag.id,
			op,
			codec,
			event: 'attachFailed',
			error: String(error),
			stack: (error as Error)?.stack
		});
	}
};

export {};
