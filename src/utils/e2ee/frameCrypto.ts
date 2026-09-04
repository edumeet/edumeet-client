import { Bytes } from './crypto';

const subtle = globalThis.crypto.subtle;

export const NONCE_BYTES = 12;
export const GCM_TAG_BYTES = 16;

// Leading bytes the SFU must read for keyframe detection (must stay clear). Derived from the CODEC
// (passed in, so identical on sender and receiver) and from the BITSTREAM, never from frame.type.
// Both ends must compute the same split or every frame fails to authenticate, and frame.type is a
// field each engine populates for itself rather than something carried on the wire, so it is the
// wrong thing to key on even where two engines happen to agree.
export function clearBytes(data: Uint8Array, codec: string): number {
	if (codec === 'opus') return 1; // audio: Opus TOC byte
	if (codec === 'vp9') return 0; // VP9: keyframe + layers live in the RTP descriptor

	if (codec === 'vp8') {
		// VP8 frame tag: P bit (bit 0 of byte 0) = 0 => keyframe (10-byte header), else delta (3).
		// byte 0 is always within the clear header, so this reads the same on encrypt and decrypt.
		return (data[0] & 0x01) === 0 ? 10 : 3;
	}

	return 3; // h264/other: not supported for E2EE, keep a minimal clear header
}

// 12-byte nonce = keyId(4) ‖ counter(8); also the SFrame header so decrypt is stateless.
export function nonceFor(keyId: number, counter: number): Bytes {
	const b = new Uint8Array(NONCE_BYTES);
	const dv = new DataView(b.buffer);

	dv.setUint32(0, keyId >>> 0);
	dv.setBigUint64(4, BigInt(counter));

	return b;
}

// The clear header is authenticated as additional data, so the SFU can read it but cannot change it.
export async function seal(data: Bytes, header: number, key: CryptoKey, nonce: Bytes): Promise<Bytes> {
	const clear = data.subarray(0, header);
	const payload = data.subarray(header);
	const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: clear }, key, payload));
	const out = new Uint8Array(header + NONCE_BYTES + ct.length);

	out.set(clear, 0);
	out.set(nonce, header);
	out.set(ct, header + NONCE_BYTES);

	return out;
}

export type Sealed = { kind: 'sealed'; header: number; keyId: number; nonce: Bytes; clear: Bytes; ct: Bytes };
export type FrameShape = { kind: 'passthrough'; header: number } | { kind: 'impossible'; header: number } | Sealed;

// A sender emits exactly two shapes: a passthrough frame with nothing past the clear header, or an
// encrypted one carrying a nonce, a tag and at least one byte of payload. Every size between those
// is unreachable for a peer, so a frame in that band did not come from one. Passing it on would
// hand the decoder unauthenticated bytes that an SFU could have injected, and at low Opus bitrates
// that band is large enough to carry audible audio, so it is reported as impossible instead.
export function parseFrame(data: Bytes, codec: string): FrameShape {
	const header = clearBytes(data, codec);

	if (data.length <= header) return { kind: 'passthrough', header };
	if (data.length < header + NONCE_BYTES + GCM_TAG_BYTES + 1) return { kind: 'impossible', header };

	const nonce = data.subarray(header, header + NONCE_BYTES);
	const keyId = new DataView(nonce.buffer, nonce.byteOffset, NONCE_BYTES).getUint32(0);

	return {
		kind: 'sealed',
		header,
		keyId,
		nonce,
		clear: data.subarray(0, header),
		ct: data.subarray(header + NONCE_BYTES),
	};
}

export async function open(frame: Sealed, key: CryptoKey): Promise<Bytes> {
	const pt = new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: frame.nonce, additionalData: frame.clear }, key, frame.ct));
	const out = new Uint8Array(frame.header + pt.length);

	out.set(frame.clear, 0);
	out.set(pt, frame.header);

	return out;
}

export type SealResult = { kind: 'passthrough'; header: number } | { kind: 'sealed'; data: Bytes };

// A whole send side step, for tests and for anyone who wants the two decisions in one call.
export async function sealFrame(data: Bytes, codec: string, key: CryptoKey, keyId: number, counter: number): Promise<SealResult> {
	const header = clearBytes(data, codec);

	if (data.length <= header) return { kind: 'passthrough', header };

	return { kind: 'sealed', data: await seal(data, header, key, nonceFor(keyId, counter)) };
}
