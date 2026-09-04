import { describe, expect, it } from 'vitest';
import { WebCryptoKeyProvider } from './WebCryptoKeyProvider';
import { peerNamespace, ratchetRaw } from './crypto';

const hex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const provider = async (id: string): Promise<WebCryptoKeyProvider> => {
	const p = new WebCryptoKeyProvider(id);

	await p.init();

	return p;
};

const introduce = async (a: WebCryptoKeyProvider, aId: string, b: WebCryptoKeyProvider, bId: string): Promise<void> => {
	await a.addPeer(bId, await b.getIdentityPublicKey());
	await b.addPeer(aId, await a.getIdentityPublicKey());
};

const receive = async (receiver: WebCryptoKeyProvider, fromId: string, sender: WebCryptoKeyProvider, toId: string) => {
	const msg = await sender.wrapLocalKeyFor(toId);

	return receiver.unwrapRemoteKey(fromId, msg.keyId, msg.iv, msg.data);
};

describe('local key', () => {
	it('starts at epoch zero in its own namespace', async () => {
		const alice = await provider('alice');
		const local = alice.localKey();

		expect(local).toBeDefined();
		expect(local!.keyId >>> 8).toBe(await peerNamespace('alice'));
		expect(local!.keyId & 0xff).toBe(0);
	});

	it('refuses to advance before it has a key', async () => {
		await expect(new WebCryptoKeyProvider('alice').ratchetLocalKey()).rejects.toThrow(/no local media key/);
	});
});

describe('peers and identity pinning', () => {
	it('pins the first identity and reports later ones', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');
		const impostor = await provider('bob');

		expect(await alice.addPeer('bob', await bob.getIdentityPublicKey())).toBe('new');
		expect(await alice.addPeer('bob', await bob.getIdentityPublicKey())).toBe('same');
		expect(await alice.addPeer('bob', await impostor.getIdentityPublicKey())).toBe('changed');
	});

	it('does not add itself', async () => {
		const alice = await provider('alice');

		expect(await alice.addPeer('alice', await alice.getIdentityPublicKey())).toBe('same');
		expect(alice.hasPeer('alice')).toBe(false);
	});

	it('forgets a removed peer', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');

		await introduce(alice, 'alice', bob, 'bob');
		expect(alice.hasPeer('bob')).toBe(true);

		alice.removePeer('bob');
		expect(alice.hasPeer('bob')).toBe(false);
		await expect(alice.wrapLocalKeyFor('bob')).rejects.toThrow(/no KEK/);
	});
});

describe('key distribution', () => {
	it('delivers the same media key to every peer', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');
		const carol = await provider('carol');

		await introduce(alice, 'alice', bob, 'bob');
		await introduce(alice, 'alice', carol, 'carol');

		const atBob = await receive(bob, 'alice', alice, 'bob');
		const atCarol = await receive(carol, 'alice', alice, 'carol');

		expect(atBob.keyId).toBe(alice.localKey()!.keyId);
		expect(atBob.raw.length).toBe(32);
		expect(hex(atBob.raw)).toBe(hex(atCarol.raw));
		expect((await alice.wrapLocalKeyForAll()).map((m) => m.toPeerId).sort()).toEqual([ 'bob', 'carol' ]);
	});

	it('rejects a key whose namespace does not match the stamped sender', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');
		const carol = await provider('carol');

		await introduce(alice, 'alice', bob, 'bob');
		await introduce(bob, 'bob', carol, 'carol');

		const msg = await alice.wrapLocalKeyFor('bob');

		await expect(bob.unwrapRemoteKey('carol', msg.keyId, msg.iv, msg.data)).rejects.toThrow(/namespace mismatch/);
	});

	it('rejects a key from a peer it has not met', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');

		await alice.addPeer('bob', await bob.getIdentityPublicKey());

		const msg = await alice.wrapLocalKeyFor('bob');

		await expect(bob.unwrapRemoteKey('alice', msg.keyId, msg.iv, msg.data)).rejects.toThrow(/no KEK/);
	});

	it('re-keys the pair when a peer presents a changed identity', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');
		const impostor = await provider('bob');

		await introduce(alice, 'alice', bob, 'bob');
		await impostor.addPeer('alice', await alice.getIdentityPublicKey());
		await alice.addPeer('bob', await impostor.getIdentityPublicKey());

		const msg = await alice.wrapLocalKeyFor('bob');

		await expect(impostor.unwrapRemoteKey('alice', msg.keyId, msg.iv, msg.data)).resolves.toBeDefined();
		await expect(bob.unwrapRemoteKey('alice', msg.keyId, msg.iv, msg.data)).rejects.toThrow();
	});
});

describe('changing the local key', () => {
	it('replaces it with unrelated material on rotate', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');

		await introduce(alice, 'alice', bob, 'bob');

		const before = await receive(bob, 'alice', alice, 'bob');

		await alice.rotateLocalKey();

		const after = await receive(bob, 'alice', alice, 'bob');

		expect(after.keyId & 0xff).toBe(1);
		expect(hex(after.raw)).not.toBe(hex(before.raw));
		expect(hex(after.raw)).not.toBe(hex(await ratchetRaw(before.raw)));
	});

	it('advances it on ratchet so a holder of the previous key can derive it', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');

		await introduce(alice, 'alice', bob, 'bob');

		const before = await receive(bob, 'alice', alice, 'bob');

		await alice.ratchetLocalKey();

		const after = await receive(bob, 'alice', alice, 'bob');

		expect(after.keyId & 0xff).toBe(1);
		expect(hex(after.raw)).toBe(hex(await ratchetRaw(before.raw)));
	});

	it('serializes concurrent changes so no two keys share an epoch', async () => {
		const alice = await provider('alice');
		const [ replaced, advanced, replacedAgain ] = await Promise.all([
			alice.rotateLocalKey(),
			alice.ratchetLocalKey(),
			alice.rotateLocalKey(),
		]);

		expect(replaced.keyId & 0xff).toBe(1);
		expect(advanced.keyId & 0xff).toBe(2);
		expect(replacedAgain.keyId & 0xff).toBe(3);
		expect(alice.localKey()!.keyId).toBe(replacedAgain.keyId);
	});

	it('derives a concurrent advance from the replacement that preceded it', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');

		await introduce(alice, 'alice', bob, 'bob');

		const [ , advanced ] = await Promise.all([ alice.rotateLocalKey(), alice.ratchetLocalKey() ]);
		const current = await receive(bob, 'alice', alice, 'bob');

		expect(current.keyId).toBe(advanced.keyId);
		expect(current.keyId & 0xff).toBe(2);
	});

	it('wraps the epoch after 256 changes', async () => {
		const alice = await provider('alice');

		for (let i = 0; i < 256; i++) await alice.rotateLocalKey();

		expect(alice.localKey()!.keyId & 0xff).toBe(0);
	});

	it('recovers the change queue after a change that fails', async () => {
		const alice = new WebCryptoKeyProvider('alice');

		await expect(alice.ratchetLocalKey()).rejects.toThrow(/no local media key/);
		await alice.init();

		expect((await alice.rotateLocalKey()).keyId & 0xff).toBe(1);
	});

	it('never wraps new bytes under the previous id while a change is in flight', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');

		await introduce(alice, 'alice', bob, 'bob');

		const before = await receive(bob, 'alice', alice, 'bob');
		const change = alice.rotateLocalKey();
		const during = await alice.wrapLocalKeyFor('bob');

		await change;

		const seen = await bob.unwrapRemoteKey('alice', during.keyId, during.iv, during.data);
		const after = await receive(bob, 'alice', alice, 'bob');
		const matchesBefore = seen.keyId === before.keyId && hex(seen.raw) === hex(before.raw);
		const matchesAfter = seen.keyId === after.keyId && hex(seen.raw) === hex(after.raw);

		expect(matchesBefore || matchesAfter).toBe(true);
	});
});
