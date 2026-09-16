import { describe, expect, it } from 'vitest';
import { MessageOpener, MessageSealer } from './messageCrypto';
import { DecryptKeyStore } from './keyStore';
import { Bytes, importMediaKey, randomKeyRaw } from './crypto';
import { NONCE_BYTES } from './frameCrypto';

const NS = 0x0abcde;
const kid = (epoch: number): number => ((NS << 8) | epoch) >>> 0;
const text = new TextEncoder();
const utf8 = new TextDecoder();

const entry = async (raw: Bytes) => ({ key: await importMediaKey(raw), raw });

const pair = () => {
	const store = new DecryptKeyStore(() => undefined);

	return { sealer: new MessageSealer(), opener: new MessageOpener(store), store };
};

describe('message crypto', () => {
	it('seals nothing without a key', async () => {
		const { sealer } = pair();

		expect(await sealer.seal(text.encode('hello'))).toBeUndefined();
	});

	it('round-trips a message under a delivered key, with the key identifier in the nonce', async () => {
		const { sealer, opener, store } = pair();
		const raw = randomKeyRaw();

		await sealer.setKey(kid(0), raw);
		store.set(kid(0), await entry(raw));

		const sealed = await sealer.seal(text.encode('hello'));

		expect(sealed).toBeDefined();
		expect(new DataView(sealed!.buffer).getUint32(0)).toBe(kid(0));
		expect(utf8.decode(await opener.open(sealed!))).toBe('hello');
	});

	it('never repeats a nonce under one key', async () => {
		const { sealer, opener, store } = pair();
		const raw = randomKeyRaw();

		await sealer.setKey(kid(0), raw);
		store.set(kid(0), await entry(raw));

		const a = await sealer.seal(text.encode('same'));
		const b = await sealer.seal(text.encode('same'));

		expect(a!.subarray(0, NONCE_BYTES)).not.toEqual(b!.subarray(0, NONCE_BYTES));
		expect(utf8.decode(await opener.open(a!))).toBe('same');
		expect(utf8.decode(await opener.open(b!))).toBe('same');
	});

	it('opens nothing it holds no key for, nothing tampered with, and nothing too short', async () => {
		const { sealer, opener, store } = pair();
		const raw = randomKeyRaw();

		await sealer.setKey(kid(0), raw);

		const sealed = await sealer.seal(text.encode('hello'));

		expect(await opener.open(sealed!)).toBeUndefined();

		store.set(kid(0), await entry(raw));
		sealed![sealed!.length - 1] ^= 1;

		expect(await opener.open(sealed!)).toBeUndefined();
		expect(await opener.open(new Uint8Array(NONCE_BYTES + 3))).toBeUndefined();
	});

	it('does not use the media key itself for messages', async () => {
		const { sealer } = pair();
		const raw = randomKeyRaw();

		await sealer.setKey(kid(0), raw);

		const sealed = await sealer.seal(text.encode('hello'));
		const nonce = sealed!.subarray(0, NONCE_BYTES);
		const ct = sealed!.subarray(NONCE_BYTES);

		await expect(globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, await importMediaKey(raw), ct)).rejects.toThrow();
	});

	it('reads a message from the previous epoch while that key is still held', async () => {
		const { sealer, opener, store } = pair();
		const first = randomKeyRaw();
		const second = randomKeyRaw();

		await sealer.setKey(kid(0), first);

		const late = await sealer.seal(text.encode('late'));

		store.set(kid(0), await entry(first));
		store.set(kid(1), await entry(second));
		await sealer.setKey(kid(1), second);

		expect(utf8.decode(await opener.open(late!))).toBe('late');
		expect(utf8.decode(await opener.open((await sealer.seal(text.encode('now')))!))).toBe('now');
	});

	it('seals under the latest key when a change is still being applied', async () => {
		const { sealer, opener, store } = pair();
		const first = randomKeyRaw();
		const second = randomKeyRaw();

		await sealer.setKey(kid(0), first);
		store.set(kid(1), await entry(second));

		void sealer.setKey(kid(1), second);

		const sealed = await sealer.seal(text.encode('after'));

		expect(new DataView(sealed!.buffer).getUint32(0)).toBe(kid(1));
		expect(utf8.decode(await opener.open(sealed!))).toBe('after');
	});
});
