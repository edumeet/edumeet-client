import { describe, expect, it } from 'vitest';
import { Bytes, importMediaKey, randomKeyRaw, ratchetRaw } from './crypto';
import { clearBytes, GCM_TAG_BYTES, NONCE_BYTES, nonceFor, open, parseFrame, seal, sealFrame, Sealed } from './frameCrypto';

const KEY_ID = ((0xabcdef << 8) | 5) >>> 0;

const hex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const frame = (length: number, firstByte: number): Bytes => {
	const out = globalThis.crypto.getRandomValues(new Uint8Array(length));

	if (length > 0) out[0] = firstByte;

	return out;
};

const sealedBytes = async (data: Bytes, codec: string, key: CryptoKey, counter = 0): Promise<Bytes> => {
	const result = await sealFrame(data, codec, key, KEY_ID, counter);

	if (result.kind !== 'sealed') throw new Error(`expected a sealed frame, got ${result.kind}`);

	return result.data;
};

const parsedSealed = (data: Bytes, codec: string): Sealed => {
	const shape = parseFrame(data, codec);

	if (shape.kind !== 'sealed') throw new Error(`expected a sealed frame, got ${shape.kind}`);

	return shape;
};

const codecs: Array<[ string, Bytes ]> = [
	[ 'opus', frame(40, 0x78) ],
	[ 'vp8', frame(200, 0x10) ],
	[ 'vp8', frame(200, 0x11) ],
	[ 'vp9', frame(120, 0x82) ],
];

describe('clear header', () => {
	it('leaves exactly the bytes the SFU needs', () => {
		expect(clearBytes(frame(10, 0x78), 'opus')).toBe(1);
		expect(clearBytes(frame(10, 0x82), 'vp9')).toBe(0);
		expect(clearBytes(frame(10, 0x10), 'vp8')).toBe(10);
		expect(clearBytes(frame(10, 0x11), 'vp8')).toBe(3);
		expect(clearBytes(frame(10, 0x65), 'h264')).toBe(3);
	});
});

describe('nonce', () => {
	it('is the key id followed by the counter, big endian', () => {
		const nonce = nonceFor(0xffffffff, (2 ** 40) + 7);
		const dv = new DataView(nonce.buffer);

		expect(nonce.length).toBe(NONCE_BYTES);
		expect(dv.getUint32(0)).toBe(0xffffffff);
		expect(dv.getBigUint64(4)).toBe(BigInt((2 ** 40) + 7));
	});

	it('differs per counter and repeats for a repeated counter', async () => {
		const key = await importMediaKey(randomKeyRaw());
		const data = frame(40, 0x78);
		const nonces = await Promise.all([ 0, 1, 2, 0 ].map(async (counter) =>
			hex((await sealedBytes(data, 'opus', key, counter)).subarray(1, 1 + NONCE_BYTES))));

		expect(new Set(nonces.slice(0, 3)).size).toBe(3);
		expect(nonces[3]).toBe(nonces[0]);
	});
});

describe('seal and open', () => {
	it.each(codecs)('round trips a %s frame', async (codec, data) => {
		const key = await importMediaKey(randomKeyRaw());
		const header = clearBytes(data, codec);
		const wire = await sealedBytes(data, codec, key);

		expect(wire.length).toBe(data.length + NONCE_BYTES + GCM_TAG_BYTES);
		expect(hex(wire.subarray(0, header))).toBe(hex(data.subarray(0, header)));

		const shape = parsedSealed(wire, codec);

		expect(shape.header).toBe(header);
		expect(shape.keyId).toBe(KEY_ID);
		expect(hex(await open(shape, key))).toBe(hex(data));
	});

	it('hides everything past the clear header', async () => {
		const key = await importMediaKey(randomKeyRaw());
		const data = frame(200, 0x10);
		const wire = await sealedBytes(data, 'vp8', key);

		expect(hex(wire.subarray(10 + NONCE_BYTES))).not.toContain(hex(data.subarray(10, 26)));
	});

	it('carries the sender namespace in the key id', async () => {
		const key = await importMediaKey(randomKeyRaw());
		const wire = await sealedBytes(frame(40, 0x78), 'opus', key);

		expect(parsedSealed(wire, 'opus').keyId >>> 8).toBe(0xabcdef);
	});
});

describe('frames with nothing to protect', () => {
	it('pass through untouched on both sides', async () => {
		const key = await importMediaKey(randomKeyRaw());

		for (const [ codec, data ] of [ [ 'opus', frame(1, 0x78) ], [ 'opus', frame(0, 0) ], [ 'vp8', frame(10, 0x10) ], [ 'vp8', frame(3, 0x11) ], [ 'vp9', frame(0, 0) ] ] as Array<[ string, Bytes ]>) {
			expect((await sealFrame(data, codec, key, KEY_ID, 0)).kind).toBe('passthrough');
			expect(parseFrame(data, codec).kind).toBe('passthrough');
		}
	});
});

describe('frames no sender could have produced', () => {
	it.each([ [ 'opus', 0x78 ], [ 'vp8', 0x11 ], [ 'vp8', 0x10 ] ])('are refused for %s between passthrough and the smallest ciphertext', (codec, firstByte) => {
		const header = clearBytes(frame(1, firstByte), codec);
		const smallest = header + NONCE_BYTES + GCM_TAG_BYTES + 1;

		for (let length = header + 1; length < smallest; length++)
			expect(parseFrame(frame(length, firstByte), codec).kind).toBe('impossible');

		expect(parseFrame(frame(smallest, firstByte), codec).kind).toBe('sealed');
	});
});

describe('tampering', () => {
	const tamperedAt = async (codec: string, data: Bytes, offset: number) => {
		const key = await importMediaKey(randomKeyRaw());
		const wire = await sealedBytes(data, codec, key);
		const index = offset < 0 ? wire.length + offset : offset;

		wire[index] ^= 0x01;

		return { shape: parseFrame(wire, codec), key };
	};

	it('rejects a changed clear byte, which the SFU can read but must not alter', async () => {
		const { shape, key } = await tamperedAt('vp8', frame(200, 0x10), 5);

		expect(shape.kind).toBe('sealed');
		await expect(open(shape as Sealed, key)).rejects.toThrow();
	});

	it('rejects a changed nonce', async () => {
		const { shape, key } = await tamperedAt('opus', frame(40, 0x78), 1 + 6);

		await expect(open(shape as Sealed, key)).rejects.toThrow();
	});

	it('rejects a changed ciphertext byte', async () => {
		const { shape, key } = await tamperedAt('opus', frame(40, 0x78), 1 + NONCE_BYTES + 3);

		await expect(open(shape as Sealed, key)).rejects.toThrow();
	});

	it('rejects a changed tag', async () => {
		const { shape, key } = await tamperedAt('opus', frame(40, 0x78), -1);

		await expect(open(shape as Sealed, key)).rejects.toThrow();
	});

	it('rejects a flipped VP8 keyframe bit, because both sides then disagree on the split', async () => {
		const key = await importMediaKey(randomKeyRaw());
		const wire = await sealedBytes(frame(200, 0x10), 'vp8', key);

		wire[0] ^= 0x01;

		const shape = parseFrame(wire, 'vp8');

		expect(shape.header).toBe(3);
		await expect(open(shape as Sealed, key)).rejects.toThrow();
	});
});

describe('wrong keys', () => {
	it('rejects another key and the next key in the chain alike', async () => {
		const raw = randomKeyRaw();
		const key = await importMediaKey(raw);
		const wire = await sealedBytes(frame(40, 0x78), 'opus', key);
		const shape = parsedSealed(wire, 'opus');

		await expect(open(shape, await importMediaKey(randomKeyRaw()))).rejects.toThrow();
		await expect(open(shape, await importMediaKey(await ratchetRaw(raw)))).rejects.toThrow();
		await expect(open(shape, key)).resolves.toBeDefined();
	});

	it('opens under the advanced key once the sender has advanced', async () => {
		const raw = randomKeyRaw();
		const advanced = await ratchetRaw(raw);
		const wire = await sealedBytes(frame(40, 0x78), 'opus', await importMediaKey(advanced));

		await expect(open(parsedSealed(wire, 'opus'), await importMediaKey(raw))).rejects.toThrow();
		await expect(open(parsedSealed(wire, 'opus'), await importMediaKey(advanced))).resolves.toBeDefined();
	});
});

describe('seal', () => {
	it('places the nonce between the clear header and the ciphertext', async () => {
		const key = await importMediaKey(randomKeyRaw());
		const data = frame(40, 0x78);
		const nonce = nonceFor(KEY_ID, 9);
		const wire = await seal(data, 1, key, nonce);

		expect(wire[0]).toBe(data[0]);
		expect(hex(wire.subarray(1, 1 + NONCE_BYTES))).toBe(hex(nonce));
		expect(wire.length).toBe(1 + NONCE_BYTES + 39 + GCM_TAG_BYTES);
	});
});
