import { describe, expect, it } from 'vitest';
import {
	deriveKek,
	fromB64,
	importMediaKey,
	makeIdentity,
	peerNamespace,
	randomKeyRaw,
	ratchetRaw,
	toB64,
	unwrapKey,
	wrapKey,
} from './crypto';

const hex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

describe('ratchetRaw', () => {
	it('is deterministic for the same input', async () => {
		const raw = randomKeyRaw();

		expect(hex(await ratchetRaw(raw))).toBe(hex(await ratchetRaw(raw)));
	});

	it('produces a 32 byte key that differs at every step', async () => {
		let raw = randomKeyRaw();
		const seen = new Set([ hex(raw) ]);

		for (let i = 0; i < 8; i++) {
			raw = await ratchetRaw(raw);
			expect(raw.length).toBe(32);
			seen.add(hex(raw));
		}

		expect(seen.size).toBe(9);
	});
});

describe('identity and pairwise KEK', () => {
	it('keeps the private key non-extractable and exports an uncompressed public point', async () => {
		const id = await makeIdentity();

		expect(id.priv.extractable).toBe(false);
		expect(id.pubRaw.length).toBe(65);
		expect(id.pubRaw[0]).toBe(4);
	});

	it('derives the same KEK on both sides of the exchange', async () => {
		const alice = await makeIdentity();
		const bob = await makeIdentity();
		const kekAb = await deriveKek(alice.priv, bob.pubRaw);
		const kekBa = await deriveKek(bob.priv, alice.pubRaw);
		const raw = randomKeyRaw();
		const { iv, data } = await wrapKey(kekAb, raw);

		expect(hex(await unwrapKey(kekBa, iv, data))).toBe(hex(raw));
	});

	it('does not let a third party unwrap', async () => {
		const alice = await makeIdentity();
		const bob = await makeIdentity();
		const carol = await makeIdentity();
		const kekAb = await deriveKek(alice.priv, bob.pubRaw);
		const kekAc = await deriveKek(alice.priv, carol.pubRaw);
		const { iv, data } = await wrapKey(kekAb, randomKeyRaw());

		await expect(unwrapKey(kekAc, iv, data)).rejects.toThrow();
	});
});

describe('wrapKey and unwrapKey', () => {
	it('rejects a tampered ciphertext', async () => {
		const id = await makeIdentity();
		const other = await makeIdentity();
		const kek = await deriveKek(id.priv, other.pubRaw);
		const { iv, data } = await wrapKey(kek, randomKeyRaw());
		const tampered = new Uint8Array(data);

		tampered[5] ^= 0x01;
		await expect(unwrapKey(kek, iv, tampered.buffer)).rejects.toThrow();
	});

	it('rejects a tampered iv', async () => {
		const id = await makeIdentity();
		const other = await makeIdentity();
		const kek = await deriveKek(id.priv, other.pubRaw);
		const { iv, data } = await wrapKey(kek, randomKeyRaw());
		const tampered = new Uint8Array(iv);

		tampered[0] ^= 0x01;
		await expect(unwrapKey(kek, tampered, data)).rejects.toThrow();
	});

	it('uses a fresh iv for every wrap', async () => {
		const id = await makeIdentity();
		const other = await makeIdentity();
		const kek = await deriveKek(id.priv, other.pubRaw);
		const raw = randomKeyRaw();
		const first = await wrapKey(kek, raw);
		const second = await wrapKey(kek, raw);

		expect(hex(first.iv)).not.toBe(hex(second.iv));
		expect(hex(new Uint8Array(first.data))).not.toBe(hex(new Uint8Array(second.data)));
	});
});

describe('peerNamespace', () => {
	it('fits in 24 bits and is stable for a peer id', async () => {
		const ns = await peerNamespace('peer-1');

		expect(ns).toBeGreaterThanOrEqual(0);
		expect(ns).toBeLessThan(1 << 24);
		expect(await peerNamespace('peer-1')).toBe(ns);
	});

	it('differs between peers', async () => {
		expect(await peerNamespace('peer-1')).not.toBe(await peerNamespace('peer-2'));
	});
});

describe('base64', () => {
	it('round trips every byte value', () => {
		const bytes = new Uint8Array(256).map((_, i) => i);

		expect(hex(fromB64(toB64(bytes)))).toBe(hex(bytes));
	});

	it('round trips an empty buffer', () => {
		expect(fromB64(toB64(new Uint8Array(0))).length).toBe(0);
	});
});

describe('importMediaKey', () => {
	it('yields a non-extractable AES-GCM key for both directions', async () => {
		const key = await importMediaKey(randomKeyRaw());

		expect(key.extractable).toBe(false);
		expect(key.algorithm.name).toBe('AES-GCM');
		expect(key.usages).toEqual(expect.arrayContaining([ 'encrypt', 'decrypt' ]));
	});
});
