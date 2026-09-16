import { describe, expect, it, vi } from 'vitest';
import {
	DecEntry,
	DecryptKeyStore,
	KEY_NEEDED_AFTER_MISSES,
	KEY_NEEDED_INTERVAL_MS,
	KEYS_KEPT_PER_SENDER,
	KeyNeeded,
	MISSING_TRACKED,
} from './keyStore';
import { Bytes, importMediaKey, randomKeyRaw } from './crypto';

const NS = 0xabcdef;
const OTHER = 0x123456;

const kid = (ns: number, epoch: number): number => (((ns << 8) | (epoch & 0xff)) >>> 0);
const entry = async (raw: Bytes): Promise<DecEntry> => ({ key: await importMediaKey(raw), raw });

const makeStore = (now: () => number = () => 0) => {
	const onKeyNeeded = vi.fn<KeyNeeded>();

	return { store: new DecryptKeyStore(onKeyNeeded, now), onKeyNeeded };
};

const epochsOf = (store: DecryptKeyStore, ns: number): number[] =>
	store.knownKeyIds()
		.filter((k) => (k >>> 8) === ns)
		.map((k) => k & 0xff);

describe('holding and evicting', () => {
	it('trims a sender to the window, oldest first', async () => {
		const { store } = makeStore();

		for (let e = 0; e <= KEYS_KEPT_PER_SENDER; e++) store.set(kid(NS, e), await entry(randomKeyRaw()));

		expect(epochsOf(store, NS)).toHaveLength(KEYS_KEPT_PER_SENDER);
		expect(Math.min(...epochsOf(store, NS))).toBe(1);
		expect(store.has(kid(NS, KEYS_KEPT_PER_SENDER))).toBe(true);
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

describe('asking for a key we do not hold', () => {
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
