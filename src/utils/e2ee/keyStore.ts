import { Bytes, importMediaKey, ratchetRaw } from './crypto';

// The bytes are kept alongside the key because a sender may advance its key rather than replace it,
// and deriving the next one needs material, not a key that can only be used.
export type DecEntry = { key: CryptoKey; raw: Bytes };

export type Chain = Array<{ id: number; entry: DecEntry }>;

// Keys a sender may still have frames in flight under. Rotations are not coalesced, so peers leaving
// together produce several in quick succession, and a sender advancing its key on each arrival adds
// more. Sixteen is what LiveKit keeps for the same reason and costs nothing worth counting.
export const KEYS_KEPT_PER_SENDER = 16;

// How far past a key we hold we are willing to derive. A sender advances once per arrival and a
// receiver only follows by decrypting a frame, so anyone the SFU was not forwarding that sender to
// falls behind by a step per arrival they missed. Deriving is one hash per step, so a generous
// ceiling costs little, and what it buys is a bound on the work a forged keyId can demand. Falling
// further behind than this is not fatal: it is reported and recovered by asking the sender.
export const MAX_RATCHET_STEPS = 32;

// A sender we cannot decrypt at all: either their key never reached us, or we have fallen further
// behind their advances than we will derive. Neither resolves by itself, so after a sustained run of
// failures the sender is named to the caller, which knows how to ask them for a key. Reported rather
// than acted on here because the worker only ever sees namespaces, never peers.
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

	// A keyId we were never sent may still be one the sender derived rather than replaced, and if so
	// we can derive it too. Nothing is stored here: the caller commits the chain only once a frame has
	// authenticated under it, so a wrong guess (the sender replaced its key) and a forged keyId both
	// leave the key map alone instead of evicting keys that work.
	async deriveChain(keyId: number): Promise<Chain | undefined> {
		const namespace = keyId >>> 8;
		const target = keyId & 0xff;
		let from: { raw: Bytes; steps: number } | undefined;

		// Nearest key behind the target, so we derive as few steps as possible. Epochs wrap at 256,
		// which is what the masked subtraction is for.
		for (const [ id, held ] of this.keys) {
			if ((id >>> 8) !== namespace) continue;

			const steps = (target - (id & 0xff)) & 0xff;

			if (steps < 1 || steps > MAX_RATCHET_STEPS) continue;
			if (!from || steps < from.steps) from = { raw: held.raw, steps };
		}

		if (!from) return undefined;

		const chain: Chain = [];
		let raw = from.raw;

		for (let i = from.steps - 1; i >= 0; i--) {
			raw = await ratchetRaw(raw);
			chain.push({ id: ((namespace << 8) | ((target - i) & 0xff)) >>> 0, entry: { key: await importMediaKey(raw), raw } });
		}

		return chain;
	}

	commitChain(chain: Chain): void {
		for (const { id, entry } of chain) {
			this.keys.delete(id);
			this.keys.set(id, entry);
		}

		this.evictOldKeys(chain[0].id >>> 8);
	}

	// keyId is namespace(24 bits) | epoch(8 bits), and the namespace identifies the sender, so keys can
	// be aged out per sender without the worker knowing anything about peers. Without this the map
	// grows for the life of the session and every key ever received stays valid, so an SFU could
	// replay old frames indefinitely. It also makes the epoch wrapping after 256 rotations a
	// non-event: no key old enough to collide with a reused id is still here.
	evictOldKeys(namespace: number): void {
		const mine = [ ...this.keys.keys() ].filter((k) => (k >>> 8) === namespace);

		for (const stale of mine.slice(0, Math.max(0, mine.length - KEYS_KEPT_PER_SENDER)))
			this.keys.delete(stale);
	}
}
