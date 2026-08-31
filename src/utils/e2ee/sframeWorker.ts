/* eslint-disable @typescript-eslint/no-explicit-any */
// E2EE media transform worker — runs inside RTCRtpScriptTransform, off the main thread.
// Encrypts our outgoing frames with our media key; decrypts incoming frames by keyId.
// Codec-aware clear header (Phase 0, source-proven vs mediasoup): VP8 10/3, VP9 0, Opus audio 1.
// Keys arrive via postMessage (CryptoKey is structured-cloneable); never leaves the worker.

const subtle = (globalThis as any).crypto.subtle;

const enc: { key?: CryptoKey; keyId: number; counter: number } = { keyId: 0, counter: 0 };
const dec = { keys: new Map<number, CryptoKey>() };
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
const NONCE_BYTES = 12;
const GCM_TAG_BYTES = 16;

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

// Leading bytes the SFU must read for keyframe detection (must stay clear). Derived from the CODEC
// (passed in, identical on sender + receiver) and the BITSTREAM — never from frame.type, which
// Firefox and Chromium expose differently and so desynced the clear-byte split, corrupting media
// between FF and Chromium even though the key was correct.
function clearBytes(frame: any, codec: string): number {
	if (codec === 'opus') return 1; // audio: Opus TOC byte
	if (codec === 'vp9') return 0; // VP9: keyframe + layers live in the RTP descriptor

	if (codec === 'vp8') {
		// VP8 frame tag: P bit (bit 0 of byte 0) = 0 => keyframe (10-byte header), else delta (3).
		// byte 0 is always within the clear header, so this reads the same on encrypt and decrypt.
		const b0 = new Uint8Array(frame.data, 0, 1)[0];

		return (b0 & 0x01) === 0 ? 10 : 3;
	}

	return 3; // h264/other: not supported for E2EE, keep a minimal clear header
}

// 12-byte nonce = keyId(4) ‖ counter(8); also the SFrame header so decrypt is stateless.
function nonceFor(keyId: number, counter: number): Uint8Array {
	const b = new Uint8Array(12);
	const dv = new DataView(b.buffer);

	dv.setUint32(0, keyId >>> 0);
	dv.setBigUint64(4, BigInt(counter));
	
	return b;
}

async function encrypt(frame: any, controller: any, codec: string, diag: Diag): Promise<void> {
	diag.seen++;
	if (!enc.key) return drop(diag, 'noEncKey'); // no key yet -> don't emit cleartext
	try {
		const header = clearBytes(frame, codec);
		const data = new Uint8Array(frame.data);
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

		const clear = data.subarray(0, header);
		const payload = data.subarray(header);
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

		const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: clear }, enc.key, payload));
		const out = new Uint8Array(header + 12 + ct.length);

		out.set(clear, 0);
		out.set(nonce, header);
		out.set(ct, header + 12);
		frame.data = out.buffer;
		diag.ok++;
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
	if (dec.keys.size === 0) return drop(diag, 'noDecKeys');
	try {
		const header = clearBytes(frame, codec);
		const data = new Uint8Array(frame.data);
		// Mirror of the sender's short-frame passthrough: anything below this cannot be one of ours.

		if (data.length < header + NONCE_BYTES + GCM_TAG_BYTES) {
			diag.passed++;
			markHandled(diag, 'decrypt', codec);
			controller.enqueue(frame);
			tick(diag);

			return;
		}

		const clear = data.subarray(0, header);
		const nonce = data.subarray(header, header + 12);
		const keyId = new DataView(nonce.buffer, nonce.byteOffset, 12).getUint32(0);
		const key = dec.keys.get(keyId);

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
				knownKeyIds: [ ...dec.keys.keys() ],
				wireHead: hex(data, Math.min(16, data.length)),
				...frameShape(frame)
			});
		}

		// An unknown keyId is the signature of a clear-byte disagreement between sender and receiver:
		// the nonce is read at the wrong offset, so this is ciphertext being parsed as a header.
		if (!key) return drop(diag, 'unknownKeyId', { keyId, knownKeyIds: [ ...dec.keys.keys() ], header });
		const ct = data.subarray(header + 12);
		const pt = new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: nonce, additionalData: clear }, key, ct));
		const out = new Uint8Array(header + pt.length);

		out.set(clear, 0);
		out.set(pt, header);
		frame.data = out.buffer;
		diag.ok++;
		if (diag.ok === 1) report({ level: 'debug', id: diag.id, op: 'decrypt', codec, event: 'firstFrame' });
		markHandled(diag, 'decrypt', codec);
		controller.enqueue(frame);
	} catch (error) {
		// Correct keyId but failed authentication: same key, different clear/ciphertext split.
		drop(diag, 'gcmAuthFailed', { error: String(error), bytes: frame.data?.byteLength, header: clearBytes(frame, codec) });
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
		enc.key = m.key; enc.keyId = m.keyId >>> 0; enc.counter = 0;
		report({ level: 'debug', event: 'encKey', keyId: enc.keyId });
		// Our key changed (rotation) -> emit a fresh keyframe so receivers re-sync.
		requestKeyFrames(encTransformers, 'generateKeyFrame');
	} else if (m.type === 'decKey') {
		dec.keys.set(m.keyId >>> 0, m.key);
		report({ level: 'debug', event: 'decKey', keyId: m.keyId >>> 0, knownKeyIds: [ ...dec.keys.keys() ] });
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
	const diag: Diag = { id: ++diagSeq, op, codec, seen: 0, ok: 0, passed: 0, drops: {}, windowDrops: {}, windowSeen: 0, windowOk: 0, nextSummary: 0 };

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
