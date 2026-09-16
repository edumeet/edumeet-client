import { describe, expect, it } from 'vitest';
import { deriveMessageKey, fromB64, importMediaKey, randomKeyRaw, toB64 } from './crypto';

const hex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

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

describe('deriveMessageKey', () => {
	it('is a non-extractable AES-GCM key that is not the media key', async () => {
		const raw = randomKeyRaw();
		const messageKey = await deriveMessageKey(raw);
		const nonce = new Uint8Array(12);
		const plain = new Uint8Array([ 1, 2, 3 ]);
		const ct = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, messageKey, plain);

		expect(messageKey.extractable).toBe(false);
		expect(messageKey.algorithm.name).toBe('AES-GCM');
		await expect(globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, await importMediaKey(raw), ct)).rejects.toThrow();
	});

	it('is the same on both sides for the same material', async () => {
		const raw = randomKeyRaw();
		const nonce = new Uint8Array(12);
		const plain = new Uint8Array([ 1, 2, 3 ]);
		const ct = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, await deriveMessageKey(raw), plain);
		const out = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, await deriveMessageKey(raw), ct);

		expect(new Uint8Array(out)).toEqual(plain);
	});
});
