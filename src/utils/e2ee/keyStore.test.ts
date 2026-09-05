import { describe, expect, it, vi } from 'vitest';
import {
	DecEntry,
	DecryptKeyStore,
	KEY_NEEDED_AFTER_MISSES,
	KEY_NEEDED_INTERVAL_MS,
	KEYS_KEPT_PER_SENDER,
	KeyNeeded,
	MAX_RATCHET_STEPS,
	MISSING_TRACKED,
} from './keyStore';
import { Bytes, importMediaKey, randomKeyRaw, ratchetRaw } from './crypto';

const NS = 0xabcdef;
const OTHER = 0x123456;

const kid = (ns: number, epoch: number): number => (((ns << 8) | (epoch & 0xff)) >>> 0);
const hex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const entry = async (raw: Bytes): Promise<DecEntry> => ({ key: await importMediaKey(raw), raw });

const advance = async (raw: Bytes, steps: number): Promise<Bytes> => {
	let out = raw;

	for (let i = 0; i < steps; i++) out = await ratchetRaw(out);

	return out;
};

const makeStore = (now: () => number = () => 0) => {
	const onKeyNeeded = vi.fn<KeyNeeded>();

	return { store: new DecryptKeyStore(onKeyNeeded, now), onKeyNeeded };
};

const epochsOf = (store: DecryptKeyStore, ns: number): number[] =>
	store.knownKeyIds()
		.filter((k) => (k >>> 8) === ns)
		.map((k) => k & 0xff);

describe('deriving a sender key we were never sent', () => {
	it('derives one step and lands on the target id', async () => {
		const { store } = makeStore();
		const k0 = randomKeyRaw();

		store.set(kid(NS, 0), await entry(k0));

		const chain = await store.deriveChain(kid(NS, 1));

		expect(chain).toHaveLength(1);
		expect(chain?.[0].id).toBe(kid(NS, 1));
		expect(hex(chain![0].entry.raw)).toBe(hex(await ratchetRaw(k0)));
	});

	it('derives several steps in order', async () => {
		const { store } = makeStore();
		const k0 = randomKeyRaw();

		store.set(kid(NS, 0), await entry(k0));

		const chain = await store.deriveChain(kid(NS, 5));

		expect(chain?.map((c) => c.id & 0xff)).toEqual([ 1, 2, 3, 4, 5 ]);
		expect(hex(chain![4].entry.raw)).toBe(hex(await advance(k0, 5)));
	});

	it('wraps the epoch at 256', async () => {
		const { store } = makeStore();
		const k250 = randomKeyRaw();

		store.set(kid(NS, 250), await entry(k250));

		const chain = await store.deriveChain(kid(NS, 2));

		expect(chain?.map((c) => c.id & 0xff)).toEqual([ 251, 252, 253, 254, 255, 0, 1, 2 ]);
		expect(hex(chain![7].entry.raw)).toBe(hex(await advance(k250, 8)));
	});

	it('refuses to derive further than the bound', async () => {
		const { store } = makeStore();

		store.set(kid(NS, 0), await entry(randomKeyRaw()));

		expect(await store.deriveChain(kid(NS, MAX_RATCHET_STEPS))).toHaveLength(MAX_RATCHET_STEPS);
		expect(await store.deriveChain(kid(NS, MAX_RATCHET_STEPS + 1))).toBeUndefined();
	});

	it('refuses the same epoch and anything behind it', async () => {
		const { store } = makeStore();

		store.set(kid(NS, 5), await entry(randomKeyRaw()));

		expect(await store.deriveChain(kid(NS, 5))).toBeUndefined();
		expect(await store.deriveChain(kid(NS, 4))).toBeUndefined();
	});

	it('never starts from another sender', async () => {
		const { store } = makeStore();

		store.set(kid(OTHER, 0), await entry(randomKeyRaw()));

		expect(await store.deriveChain(kid(NS, 1))).toBeUndefined();
	});

	it('starts from the nearest key behind the target', async () => {
		const { store } = makeStore();
		const k0 = randomKeyRaw();
		const k3 = await advance(k0, 3);

		store.set(kid(NS, 0), await entry(k0));
		store.set(kid(NS, 3), await entry(k3));

		const chain = await store.deriveChain(kid(NS, 4));

		expect(chain).toHaveLength(1);
		expect(hex(chain![0].entry.raw)).toBe(hex(await ratchetRaw(k3)));
	});
});

describe('committing and evicting', () => {
	it('keeps the target after a maximal catch-up and trims to the window', async () => {
		const { store } = makeStore();

		store.set(kid(NS, 0), await entry(randomKeyRaw()));

		const chain = await store.deriveChain(kid(NS, MAX_RATCHET_STEPS));

		store.commitChain(chain!);

		expect(store.has(kid(NS, MAX_RATCHET_STEPS))).toBe(true);
		expect(epochsOf(store, NS)).toHaveLength(KEYS_KEPT_PER_SENDER);
		expect(Math.min(...epochsOf(store, NS))).toBe(MAX_RATCHET_STEPS - KEYS_KEPT_PER_SENDER + 1);
	});

	it('evicts per sender only', async () => {
		const { store } = makeStore();

		store.set(kid(NS, 0), await entry(randomKeyRaw()));
		for (let e = 0; e < 20; e++) store.set(kid(OTHER, e), await entry(randomKeyRaw()));

		expect(epochsOf(store, OTHER)).toHaveLength(KEYS_KEPT_PER_SENDER);
		expect(epochsOf(store, NS)).toEqual([ 0 ]);
	});

	it('moves a re-delivered key to most recent', async () => {
		const { store } = makeStore();

		for (let e = 0; e < KEYS_KEPT_PER_SENDER; e++) store.set(kid(NS, e), await entry(randomKeyRaw()));
		store.set(kid(NS, 0), await entry(randomKeyRaw()));
		store.set(kid(NS, KEYS_KEPT_PER_SENDER), await entry(randomKeyRaw()));

		expect(store.has(kid(NS, 0))).toBe(true);
		expect(store.has(kid(NS, 1))).toBe(false);
	});

	it('drops one sender and nobody else', async () => {
		const { store } = makeStore();

		store.set(kid(NS, 0), await entry(randomKeyRaw()));
		store.set(kid(NS, 1), await entry(randomKeyRaw()));
		store.set(kid(OTHER, 0), await entry(randomKeyRaw()));
		store.dropNamespace(NS);

		expect(store.knownKeyIds()).toEqual([ kid(OTHER, 0) ]);
	});
});

describe('a key id whose derivation failed to authenticate', () => {
	it('is not derived again until a key for that sender is delivered', async () => {
		const { store } = makeStore();

		store.set(kid(NS, 0), await entry(randomKeyRaw()));
		expect(await store.deriveChain(kid(NS, 1))).toHaveLength(1);

		store.deriveFailed(kid(NS, 1));
		expect(store.isUndeliverable(kid(NS, 1))).toBe(true);
		expect(await store.deriveChain(kid(NS, 1))).toBeUndefined();
		expect(await store.deriveChain(kid(NS, 2))).toHaveLength(2);

		store.set(kid(NS, 1), await entry(randomKeyRaw()));
		expect(store.isUndeliverable(kid(NS, 1))).toBe(false);
		expect(store.has(kid(NS, 1))).toBe(true);
		expect(await store.deriveChain(kid(NS, 2))).toHaveLength(1);
	});

	it('is forgotten when the sender leaves, and never affects another sender', async () => {
		const { store } = makeStore();

		store.set(kid(NS, 0), await entry(randomKeyRaw()));
		store.set(kid(OTHER, 0), await entry(randomKeyRaw()));
		store.deriveFailed(kid(NS, 1));

		expect(await store.deriveChain(kid(OTHER, 1))).toHaveLength(1);

		store.dropNamespace(NS);
		store.set(kid(NS, 0), await entry(randomKeyRaw()));
		expect(await store.deriveChain(kid(NS, 1))).toHaveLength(1);
	});
});

describe('asking for a key we cannot derive', () => {
	const missMany = (store: DecryptKeyStore, ns: number, times: number): void => {
		for (let i = 0; i < times; i++) store.missed(ns);
	};

	it('asks after a sustained run of misses, then no more than once per interval', () => {
		let now = 0;
		const { store, onKeyNeeded } = makeStore(() => now);

		missMany(store, NS, KEY_NEEDED_AFTER_MISSES - 1);
		expect(onKeyNeeded).not.toHaveBeenCalled();

		store.missed(NS);
		expect(onKeyNeeded).toHaveBeenCalledTimes(1);
		expect(onKeyNeeded).toHaveBeenCalledWith(NS);

		missMany(store, NS, KEY_NEEDED_AFTER_MISSES);
		expect(onKeyNeeded).toHaveBeenCalledTimes(1);

		now = KEY_NEEDED_INTERVAL_MS;
		missMany(store, NS, KEY_NEEDED_AFTER_MISSES);
		expect(onKeyNeeded).toHaveBeenCalledTimes(2);
	});

	it('starts over once a frame decrypts or a key is delivered or the sender leaves', async () => {
		const { store, onKeyNeeded } = makeStore();

		missMany(store, NS, KEY_NEEDED_AFTER_MISSES - 1);
		store.decrypted(NS);
		missMany(store, NS, KEY_NEEDED_AFTER_MISSES - 1);
		store.set(kid(NS, 0), await entry(randomKeyRaw()));
		missMany(store, NS, KEY_NEEDED_AFTER_MISSES - 1);
		store.dropNamespace(NS);
		missMany(store, NS, KEY_NEEDED_AFTER_MISSES - 1);

		expect(onKeyNeeded).not.toHaveBeenCalled();
	});

	it('never asks for namespaces that only ever appear once', () => {
		const { store, onKeyNeeded } = makeStore();

		for (let i = 0; i < 100000; i++) store.missed((i * 2654435761) >>> 8);

		expect(onKeyNeeded).not.toHaveBeenCalled();
	});

	it('still asks for a real sender while invented namespaces churn alongside it', () => {
		const { store, onKeyNeeded } = makeStore();

		for (let i = 0; i < KEY_NEEDED_AFTER_MISSES; i++) {
			store.missed(NS);
			store.missed((i * 7919) >>> 8);
		}

		expect(onKeyNeeded).toHaveBeenCalledTimes(1);
		expect(onKeyNeeded).toHaveBeenCalledWith(NS);
	});

	it('forgets a sender that has not been missed recently', () => {
		const { store, onKeyNeeded } = makeStore();

		store.missed(NS);
		for (let i = 1; i <= MISSING_TRACKED; i++) store.missed(OTHER + i);
		missMany(store, NS, KEY_NEEDED_AFTER_MISSES - 1);

		expect(onKeyNeeded).not.toHaveBeenCalled();

		store.missed(NS);
		expect(onKeyNeeded).toHaveBeenCalledTimes(1);
	});
});
