// Native WebCrypto primitives shared by the E2EE media and message paths. Key agreement itself is
// MLS (see MlsKeyProvider); this is only what turns agreed key material into usable keys.

const subtle = globalThis.crypto.subtle;
const te = new TextEncoder();

// WebCrypto wants ArrayBuffer-backed views (not SharedArrayBuffer), so pin the generic.
export type Bytes = Uint8Array<ArrayBuffer>;

export const randomKeyRaw = (): Bytes => globalThis.crypto.getRandomValues(new Uint8Array(32));

// The per-sender media key, ready for the SFrame worker (non-extractable).
export const importMediaKey = (raw: Bytes): Promise<CryptoKey> =>
	subtle.importKey('raw', raw, 'AES-GCM', false, [ 'encrypt', 'decrypt' ]);

// A second key from the same material, for messages sent over a data channel. The media key and
// its nonce counter live in the worker and this one has its own, so a message and a frame can never
// share a nonce under one key.
export const deriveMessageKey = async (raw: Bytes): Promise<CryptoKey> => {
	const hk = await subtle.importKey('raw', raw, 'HKDF', false, [ 'deriveKey' ]);

	return subtle.deriveKey(
		{ name: 'HKDF', hash: 'SHA-256', salt: te.encode('edumeet-e2ee/v1'), info: te.encode('message') },
		hk, { name: 'AES-GCM', length: 256 }, false, [ 'encrypt', 'decrypt' ]
	);
};

// Binary <-> base64 so key packages and group messages survive the JSON signaling relay.
export const toB64 = (buf: ArrayBuffer | Bytes): string => {
	const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
	let s = '';

	for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);

	return btoa(s);
};

export const fromB64 = (s: string): Bytes => {
	const bin = atob(s);
	const out = new Uint8Array(bin.length);

	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);

	return out;
};
