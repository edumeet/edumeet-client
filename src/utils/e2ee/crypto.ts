// Native WebCrypto primitives for E2EE key agreement — no deps, no WASM.
// ECDH-P256 -> HKDF -> AES-GCM key-wrapping key (KEK); wrap/unwrap per-participant media keys.
// Same construction validated by the feasibility spike + browser test app.

const subtle = globalThis.crypto.subtle;
const te = new TextEncoder();

// WebCrypto wants ArrayBuffer-backed views (not SharedArrayBuffer), so pin the generic.
export type Bytes = Uint8Array<ArrayBuffer>;

export interface Identity {
	priv: CryptoKey;
	pubRaw: Bytes;
}

export interface Wrapped {
	iv: Bytes;
	data: ArrayBuffer;
}

export const makeIdentity = async (): Promise<Identity> => {
	// extractable=false -> the private key can't be exported by in-page JS. The public key of an ECDH
	// pair is always extractable regardless, so exportKey('raw', publicKey) below still works.
	const kp = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, [ 'deriveBits' ]);
	const pubRaw = new Uint8Array(await subtle.exportKey('raw', kp.publicKey));

	return { priv: kp.privateKey, pubRaw };
};

// Pairwise key-wrapping key: ECDH shared secret -> HKDF -> AES-GCM-256.
export const deriveKek = async (myPriv: CryptoKey, theirPubRaw: Bytes, info = 'kek'): Promise<CryptoKey> => {
	const theirPub = await subtle.importKey('raw', theirPubRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
	const shared = await subtle.deriveBits({ name: 'ECDH', public: theirPub }, myPriv, 256);
	const hk = await subtle.importKey('raw', shared, 'HKDF', false, [ 'deriveKey' ]);

	return subtle.deriveKey(
		{ name: 'HKDF', hash: 'SHA-256', salt: te.encode('edumeet-e2ee/v1'), info: te.encode(info) },
		hk, { name: 'AES-GCM', length: 256 }, false, [ 'encrypt', 'decrypt' ]
	);
};

export const wrapKey = async (kek: CryptoKey, raw: Bytes): Promise<Wrapped> => {
	const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
	const data = await subtle.encrypt({ name: 'AES-GCM', iv }, kek, raw);

	return { iv, data };
};

export const unwrapKey = async (kek: CryptoKey, iv: Bytes, data: ArrayBuffer): Promise<Bytes> =>
	new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv }, kek, data));

export const randomKeyRaw = (): Bytes => globalThis.crypto.getRandomValues(new Uint8Array(32));

// The per-participant media key, ready for the SFrame worker (non-extractable).
export const importMediaKey = (raw: Bytes): Promise<CryptoKey> =>
	subtle.importKey('raw', raw, 'AES-GCM', false, [ 'encrypt', 'decrypt' ]);

// 24-bit namespace from peerId so a sender's keyIds never collide with another sender's.
export const peerNamespace = async (peerId: string): Promise<number> => {
	const hash = new Uint8Array(await subtle.digest('SHA-256', te.encode(peerId)));

	return ((hash[0] << 16) | (hash[1] << 8) | hash[2]) >>> 0;
};

// Binary <-> base64 so key/identity blobs survive the JSON signaling relay.
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
