import { Bytes, deriveMessageKey } from './crypto';
import { GCM_TAG_BYTES, NONCE_BYTES, nonceFor, open, seal } from './frameCrypto';
import { DecryptKeyStore } from './keyStore';

// Messages on a data channel, transcripts today, are protected under the sender's current key just
// as its frames are, but as whole messages: the SFU forwards data channel messages without reading
// them, so nothing has to stay clear. The wire format is the frame format with a zero-length clear
// header, nonce then ciphertext, and the nonce carries the key identifier.

export class MessageSealer {
	#keyId?: number;
	#key?: CryptoKey;
	#counter = 0;
	// Key changes are applied in order and a seal waits for the latest, so a message sent right after
	// an epoch change never goes out under the key it replaced.
	#change: Promise<void> = Promise.resolve();

	get keyId(): number | undefined {
		return this.#keyId;
	}

	setKey(keyId: number, raw: Bytes): Promise<void> {
		this.#change = this.#change.catch(() => undefined).then(async () => {
			const key = await deriveMessageKey(raw);

			this.#keyId = keyId;
			this.#key = key;
			this.#counter = 0;
		});

		return this.#change;
	}

	async seal(plain: Bytes): Promise<Bytes | undefined> {
		await this.#change;

		if (this.#key === undefined || this.#keyId === undefined) return undefined;

		return seal(plain, 0, this.#key, nonceFor(this.#keyId, this.#counter++));
	}
}

export class MessageOpener {
	readonly #store: DecryptKeyStore;

	constructor(store: DecryptKeyStore) {
		this.#store = store;
	}

	async open(sealed: Bytes): Promise<Bytes | undefined> {
		if (sealed.length < NONCE_BYTES + GCM_TAG_BYTES) return undefined;

		const nonce = sealed.subarray(0, NONCE_BYTES);
		const keyId = new DataView(nonce.buffer, nonce.byteOffset, NONCE_BYTES).getUint32(0);
		const namespace = keyId >>> 8;
		const raw = this.#store.get(keyId)?.raw;

		if (!raw) {
			this.#store.missed(namespace);

			return undefined;
		}

		// Derived on every message rather than cached: messages are rare next to frames, and a cache
		// would have to notice a key identifier being reused with new material.
		const key = await deriveMessageKey(raw);

		try {
			const out = await open({ kind: 'sealed', header: 0, keyId, nonce, clear: sealed.subarray(0, 0), ct: sealed.subarray(NONCE_BYTES) }, key);

			this.#store.decrypted(namespace);

			return out;
		} catch {
			return undefined;
		}
	}
}
