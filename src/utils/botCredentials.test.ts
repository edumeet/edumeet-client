import { describe, expect, it } from 'vitest';

import { generateBotToken, hashBotToken, invalidRanges, isAddressOrRange, parseRangeList, providerFormState } from './botCredentials';

describe('bot access tokens', () => {
	it('mints a 32-byte url-safe token that differs every time', () => {
		const a = generateBotToken();
		const b = generateBotToken();

		expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(a).not.toBe(b);
	});

	it('hashes the way the management server does', async () => {
		expect(await hashBotToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
	});
});

describe('address ranges in the form', () => {
	it('accepts addresses and ranges of both families', () => {
		for (const entry of [ '10.0.0.5', '10.0.0.0/8', '0.0.0.0/0', '2001:db8::1', '2001:db8::/32', '::/0', ' 192.168.1.1 ' ]) {
			expect(isAddressOrRange(entry), entry).toBe(true);
		}
	});

	it('refuses names, bad octets and bad prefixes', () => {
		for (const entry of [ 'recorder.example.edu', '256.1.1.1', '10.0.0.0/33', '2001:db8::/129', '10.0.0.0/8/1', '', 'abc', '1.2.3' ]) {
			expect(isAddressOrRange(entry), entry).toBe(false);
		}
	});

	it('splits a pasted list on lines and commas', () => {
		expect(parseRangeList('10.0.0.0/8\n\n 2001:db8::/32 ,203.0.113.7,\n')).toEqual([ '10.0.0.0/8', '2001:db8::/32', '203.0.113.7' ]);
		expect(invalidRanges([ '10.0.0.0/8', 'nope', '1.2.3' ])).toEqual([ 'nope', '1.2.3' ]);
	});
});

describe('the provider part of the form', () => {
	const form = (over: Partial<Parameters<typeof providerFormState>[0]> = {}) =>
		providerFormState({ jobTypes: [], apiUrl: '', apiSecret: '', hasApiSecret: false, ...over });

	it('is fine when empty, and when a job type, an https address and a key are all there', () => {
		expect(form()).toEqual({ cleared: true, incomplete: false });
		expect(form({ jobTypes: [ 'recorder' ], apiUrl: 'https://rec.example.com', apiSecret: 'key' })).toEqual({ cleared: false, incomplete: false });
	});

	it('is fine with several job types', () => {
		expect(form({ jobTypes: [ 'recorder', 'streamer', 'transcriber' ], apiUrl: 'https://rec.example.com', apiSecret: 'key' })).toEqual({ cleared: false, incomplete: false });
	});

	it('keeps a stored key when the key field is left empty', () => {
		expect(form({ jobTypes: [ 'recorder' ], apiUrl: 'https://rec.example.com', hasApiSecret: true }).incomplete).toBe(false);
	});

	it('lets a provider be turned back into a plain key although a key is stored', () => {
		expect(form({ hasApiSecret: true })).toEqual({ cleared: true, incomplete: false });
	});

	it('is incomplete with a part missing or an address the room server cannot use', () => {
		expect(form({ jobTypes: [ 'recorder' ] }).incomplete).toBe(true);
		expect(form({ apiUrl: 'https://rec.example.com', apiSecret: 'key' }).incomplete).toBe(true);
		expect(form({ jobTypes: [ 'recorder' ], apiUrl: 'https://rec.example.com' }).incomplete).toBe(true);
		expect(form({ jobTypes: [ 'recorder' ], apiUrl: 'http://rec.example.com', apiSecret: 'key' }).incomplete).toBe(true);
		expect(form({ jobTypes: [ 'recorder' ], apiUrl: 'https://rec.example.com/?a=1', apiSecret: 'key' }).incomplete).toBe(true);
		expect(form({ jobTypes: [ 'recorder' ], apiUrl: 'https://user:pw@rec.example.com', apiSecret: 'key' }).incomplete).toBe(true);
	});
});
