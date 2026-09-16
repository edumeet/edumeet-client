import { Bytes } from './crypto';

// The bytes are kept alongside the key because the main thread derives a message key from them.
export type DecEntry = { key: CryptoKey; raw: Bytes };

// Keys a sender may still have frames in flight under. Commits are not coalesced, so peers leaving
// together produce several epochs in quick succession. Sixteen is what LiveKit keeps for the same
// reason and costs nothing worth counting.
export const KEYS_KEPT_PER_SENDER = 16;

// A sender we cannot decrypt at all: their key for this epoch has not reached us, so we are behind
// the group. That does not resolve by itself, so after a sustained run of failures the sender is
// named to the caller, which knows how to check the epoch. Reported rather than acted on here
// because the worker only ever sees namespaces, never peers.
// Roughly three seconds of a stream. Long enough that a key still in flight during a busy join is not
// mistaken for a missing one, short enough that a genuinely stuck participant recovers quickly.
export const KEY_NEEDED_AFTER_MISSES = 90;
export const KEY_NEEDED_INTERVAL_MS = 5000;

// A namespace comes out of the frame, so a stream we are reading at the wrong offset yields a fresh
// invented one every frame. Those never repeat and so never reach the threshold, but they would grow
// the tracker without limit, hence a cap. Entries are re-inserted on each miss so the order tracks
// recency and the one dropped is the one least recently missed.
export const MISSING_TRACKED = 64;

// eslint-disable-next-line no-unused-vars
export type KeyNeeded = (namespace: number) => void;

export class DecryptKeyStore {
	readonly keys = new Map<number, DecEntry>();
	readonly #missing = new Map<number, { misses: number; asked?: number }>();
	readonly #onKeyNeeded: KeyNeeded;
	readonly #now: () => number;

	constructor(onKeyNeeded: KeyNeeded, now: () => number = Date.now) {
		this.#onKeyNeeded = onKeyNeeded;
		this.#now = now;
	}

	get size(): number {
		return this.keys.size;
	}

	has(keyId: number): boolean {
		return this.keys.has(keyId);
	}

	get(keyId: number): DecEntry | undefined {
		return this.keys.get(keyId);
	}

	knownKeyIds(): number[] {
		return [ ...this.keys.keys() ];
	}

	// Delete first so the Map's insertion order tracks recency, which is what eviction reads.
	set(keyId: number, entry: DecEntry): void {
		this.keys.delete(keyId);
		this.keys.set(keyId, entry);
		this.evictOldKeys(keyId >>> 8);
		this.#missing.delete(keyId >>> 8);
	}

	// A peer left: nothing they sent can still be decodable, so drop their keys outright.
	dropNamespace(namespace: number): void {
		for (const k of [ ...this.keys.keys() ].filter((k2) => (k2 >>> 8) === namespace))
			this.keys.delete(k);

		this.#missing.delete(namespace);
	}

	decrypted(namespace: number): void {
		this.#missing.delete(namespace);
	}

	missed(namespace: number): void {
		const state = this.#missing.get(namespace) ?? { misses: 0 };

		state.misses++;
		this.#missing.delete(namespace);
		this.#missing.set(namespace, state);

		for (const stale of [ ...this.#missing.keys() ].slice(0, Math.max(0, this.#missing.size - MISSING_TRACKED)))
			this.#missing.delete(stale);

		if (state.misses < KEY_NEEDED_AFTER_MISSES) return;

		const now = this.#now();

		if (state.asked !== undefined && now - state.asked < KEY_NEEDED_INTERVAL_MS) return;

		state.asked = now;
		state.misses = 0;
		this.#onKeyNeeded(namespace);
	}

	// keyId is namespace(24 bits) | epoch(8 bits), and the namespace identifies the sender, so keys can
	// be aged out per sender without the worker knowing anything about peers. Without this the map
	// grows for the life of the session and every key ever received stays valid, so an SFU could
	// replay old frames indefinitely. It also makes the epoch wrapping after 256 commits a
	// non-event: no key old enough to collide with a reused id is still here.
	evictOldKeys(namespace: number): void {
		const mine = [ ...this.keys.keys() ].filter((k) => (k >>> 8) === namespace);

		for (const stale of mine.slice(0, Math.max(0, mine.length - KEYS_KEPT_PER_SENDER)))
			this.keys.delete(stale);
	}
}
