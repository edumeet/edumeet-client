import { describe, expect, it } from 'vitest';
import {
	acceptAll,
	createCommit,
	createGroup,
	decode,
	defaultCredentialTypes,
	encode,
	generateKeyPackage,
	getCiphersuiteImpl,
	mlsMessageDecoder,
	mlsMessageEncoder,
	defaultProposalTypes,
	processMessage,
	unsafeTestingAuthenticationService,
	wireformats,
	type MlsContext,
} from 'ts-mls';
import { MLS_SUITE, MlsKeyProvider, PendingCommit } from './MlsKeyProvider';
import { Bytes, fromB64, toB64 } from './crypto';

const provider = async (peerId: string): Promise<MlsKeyProvider> => {
	const p = new MlsKeyProvider(peerId);

	await p.init();

	return p;
};

const hex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

// Applies an accepted commit to every member that did not produce it, as the server relay would.
const relay = async (pending: PendingCommit, committer: MlsKeyProvider, others: MlsKeyProvider[]): Promise<void> => {
	committer.accept(pending);
	for (const other of others) await other.applyCommit(pending.commit);
};

const inSync = async (members: MlsKeyProvider[]): Promise<void> => {
	const keys = await Promise.all(members.map((m) => m.frameKeys()));
	const epochs = new Set(keys.map((k) => k.epoch));

	expect(epochs.size).toBe(1);

	for (const [ i, mine ] of keys.entries()) {
		for (const [ j, theirs ] of keys.entries()) {
			if (i === j) continue;

			const seenByThem = theirs.remote.find((r) => r.leafIndex === members[i].myLeafIndex);

			expect(seenByThem?.keyId).toBe(mine.local!.keyId);
			expect(hex(seenByThem?.raw ?? new Uint8Array())).toBe(hex(mine.local!.raw));
		}
	}
};

describe('MlsKeyProvider', () => {
	it('publishes a key package the library decodes', async () => {
		const alice = await provider('alice');
		const message = decode(mlsMessageDecoder, fromB64(alice.keyPackage()));

		expect(message?.wireformat).toBe(wireformats.mls_key_package);
		expect(alice.joined).toBe(false);
		expect(alice.epoch).toBe(-1);
	});

	it('founds a group, lets others join from its GroupInfo, and derives the same frame keys for everyone', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');
		const carol = await provider('carol');

		const groupInfo = await alice.found('room');

		expect(alice.joined).toBe(true);
		expect(alice.epoch).toBe(0);
		expect(alice.members()).toEqual([ { peerId: 'alice', leafIndex: 0 } ]);

		const bobJoin = await bob.joinExternal(groupInfo);

		expect(bobJoin.epoch).toBe(0);
		await relay(bobJoin, bob, [ alice ]);

		expect(alice.epoch).toBe(1);
		expect(bob.members()).toEqual([ { peerId: 'alice', leafIndex: 0 }, { peerId: 'bob', leafIndex: 1 } ]);

		const carolJoin = await carol.joinExternal(bobJoin.groupInfo);

		expect(carolJoin.epoch).toBe(1);
		await relay(carolJoin, carol, [ alice, bob ]);

		expect(carol.members().map((m) => m.peerId)).toEqual([ 'alice', 'bob', 'carol' ]);
		await inSync([ alice, bob, carol ]);

		const keys = await bob.frameKeys();

		expect(keys.local!.keyId).toBe(((1 << 8) | (2 & 0xff)) >>> 0);
		expect(keys.remote.map((r) => r.peerId).sort()).toEqual([ 'alice', 'carol' ]);
		expect(keys.local!.raw.length).toBe(32);
	});

	it('removes departed members in one commit by the lowest leaf still present, and the leaver cannot follow', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');
		const carol = await provider('carol');

		const groupInfo = await alice.found('room');
		const bobJoin = await bob.joinExternal(groupInfo);

		await relay(bobJoin, bob, [ alice ]);

		const carolJoin = await carol.joinExternal(bobJoin.groupInfo);

		await relay(carolJoin, carol, [ alice, bob ]);

		const departed = new Set([ 'carol' ]);

		expect(alice.isCommitter(departed)).toBe(true);
		expect(bob.isCommitter(departed)).toBe(false);
		expect(alice.committerRank(departed)).toBe(0);
		expect(bob.committerRank(departed)).toBe(1);
		expect(carol.committerRank(departed)).toBe(-1);

		const before = await carol.frameKeys();
		const removal = await alice.commitRemove([ 'carol', 'nobody' ]);

		expect(removal).toBeDefined();
		await relay(removal!, alice, [ bob ]);

		expect(bob.members().map((m) => m.peerId)).toEqual([ 'alice', 'bob' ]);
		await inSync([ alice, bob ]);

		const after = await alice.frameKeys();

		expect(after.epoch).toBe(before.epoch + 1);
		expect(hex(after.local!.raw)).not.toBe(hex(before.remote.find((r) => r.peerId === 'alice')!.raw));
		expect(await alice.commitRemove([ 'nobody' ])).toBeUndefined();
	});

	it('keeps its state when the server refuses a commit, so the winning commit still applies', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');

		await relay(await bob.joinExternal(await alice.found('room')), bob, [ alice ]);

		const fromAlice = await alice.commitUpdate();
		const fromBob = await bob.commitUpdate();

		expect(fromAlice.epoch).toBe(fromBob.epoch);

		await relay(fromAlice, alice, [ bob ]);

		expect(bob.epoch).toBe(alice.epoch);
		await inSync([ alice, bob ]);
		await expect(bob.applyCommit(fromBob.commit)).rejects.toThrow();
	});

	it('resyncs by rejoining externally after missing a commit, replacing its old leaf', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');

		await relay(await bob.joinExternal(await alice.found('room')), bob, [ alice ]);

		const missed = await alice.commitUpdate();

		alice.accept(missed);

		const next = await alice.commitUpdate();

		alice.accept(next);
		await expect(bob.applyCommit(next.commit)).rejects.toThrow();

		const rejoin = await bob.joinExternal(await alice.groupInfo());

		expect(rejoin.epoch).toBe(alice.epoch);
		await relay(rejoin, bob, [ alice ]);

		expect(alice.members().map((m) => m.peerId)
			.sort()).toEqual([ 'alice', 'bob' ]);
		expect(bob.members().length).toBe(2);
		await inSync([ alice, bob ]);
	});

	it('joins afresh when a resync finds no leaf of its own, and forgets a founded group on reset', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');

		await relay(await bob.joinExternal(await alice.found('room')), bob, [ alice ]);

		const removal = await alice.commitRemove([ 'bob' ]);

		alice.accept(removal!);
		expect(alice.members().map((m) => m.peerId)).toEqual([ 'alice' ]);

		const rejoin = await bob.joinExternal(await alice.groupInfo());

		await relay(rejoin, bob, [ alice ]);
		expect(alice.members().map((m) => m.peerId)).toEqual([ 'alice', 'bob' ]);
		await inSync([ alice, bob ]);

		const carol = await provider('carol');

		await carol.found('another');
		expect(carol.joined).toBe(true);
		carol.reset();
		expect(carol.joined).toBe(false);
		expect(carol.epoch).toBe(-1);

		const carolJoin = await carol.joinExternal(rejoin.groupInfo);

		await relay(carolJoin, carol, [ alice, bob ]);
		expect(alice.members().map((m) => m.peerId)).toEqual([ 'alice', 'bob', 'carol' ]);
	});

	it('warns once when a known peer id turns up with a different signature key', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');
		const changed: string[] = [];

		alice.onIdentityChanged = (peerId) => changed.push(peerId);
		await relay(await bob.joinExternal(await alice.found('room')), bob, [ alice ]);
		expect(changed).toEqual([]);

		const impostor = await provider('bob');
		const joinAsBob = await impostor.joinExternal(await alice.groupInfo());

		await relay(joinAsBob, impostor, [ alice ]);

		// The library keeps both leaves: only a resync replaces one, and this was a plain join. The
		// warning is the defence; the group itself does not judge.
		expect(changed).toEqual([ 'bob' ]);
		expect(alice.members().filter((m) => m.peerId === 'bob').length).toBe(2);
	});

	it('reports the other keys but no key of its own once its leaf has been removed', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');

		await relay(await bob.joinExternal(await alice.found('room')), bob, [ alice ]);

		const removal = await alice.commitRemove([ 'bob' ]);

		await relay(removal!, alice, [ bob ]);

		const keys = await bob.frameKeys();

		expect(keys.local).toBeUndefined();
		expect(keys.remote.map((r) => r.peerId)).toEqual([ 'alice' ]);
		expect(bob.members().map((m) => m.peerId)).toEqual([ 'alice' ]);
	});
	it('joins from a Welcome when another member adds its key package, and takes part like any member', async () => {
		const cipherSuite = await getCiphersuiteImpl(MLS_SUITE);
		const context: MlsContext = { cipherSuite, authService: unsafeTestingAuthenticationService };
		const text = new TextEncoder();
		const aliceKp = await generateKeyPackage({ credential: { credentialType: defaultCredentialTypes.basic, identity: text.encode('alice') }, cipherSuite });
		let alice = await createGroup({ context, groupId: text.encode('room'), keyPackage: aliceKp.publicPackage, privateKeyPackage: aliceKp.privatePackage });
		const bob = await provider('bob');
		const bobKp = decode(mlsMessageDecoder, fromB64(bob.keyPackage()));

		if (bobKp?.wireformat !== wireformats.mls_key_package) throw new Error('key package expected');

		const add = { proposalType: defaultProposalTypes.add, add: { keyPackage: bobKp.keyPackage } } as const;
		const commit = await createCommit({ context, state: alice, extraProposals: [ add ], ratchetTreeExtension: true });

		alice = commit.newState;
		await bob.applyWelcome(toB64(encode(mlsMessageEncoder, commit.welcome!) as Bytes));

		expect(bob.joined).toBe(true);
		expect(bob.epoch).toBe(1);
		expect(bob.members().map((m) => m.peerId)).toEqual([ 'alice', 'bob' ]);

		const carol = await provider('carol');
		const join = await carol.joinExternal(await bob.groupInfo());

		carol.accept(join);
		await bob.applyCommit(join.commit);

		const message = decode(mlsMessageDecoder, fromB64(join.commit));

		if (message?.wireformat !== wireformats.mls_public_message) throw new Error('public message expected');

		alice = (await processMessage({ context, state: alice, message, callback: acceptAll })).newState;

		expect(Number(alice.groupContext.epoch)).toBe(bob.epoch);
		await inSync([ bob, carol ]);
	});

	it('refuses messages of the wrong kind, and use before init', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');
		const groupInfo = await alice.found('room');

		await expect(bob.applyCommit(groupInfo)).rejects.toThrow('not in a group');

		const join = await bob.joinExternal(groupInfo);

		await expect(bob.joinExternal(join.commit)).rejects.toThrow('expected a GroupInfo');
		await relay(join, bob, [ alice ]);
		await expect(bob.applyCommit(groupInfo)).rejects.toThrow('expected a commit');
		await expect(bob.applyWelcome(groupInfo)).rejects.toThrow('expected a Welcome');
		await expect(bob.applyCommit('AAAA')).rejects.toThrow();

		const raw = new MlsKeyProvider('dave');

		expect(() => raw.keyPackage()).toThrow('not initialised');
		await expect(raw.found('x')).rejects.toThrow('not initialised');
		expect(raw.joined).toBe(false);
		expect(raw.epoch).toBe(-1);
		expect(raw.myLeafIndex).toBe(-1);
		expect(raw.peerId).toBe('dave');
	});

	it('changes every key on an update commit, and a member returning with its own key raises no warning', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');
		const changed: string[] = [];

		alice.onIdentityChanged = (peerId) => changed.push(peerId);
		await relay(await bob.joinExternal(await alice.found('room')), bob, [ alice ]);

		const before = await bob.frameKeys();
		const update = await bob.commitUpdate();

		await relay(update, bob, [ alice ]);

		const after = await bob.frameKeys();

		expect(after.epoch).toBe(before.epoch + 1);
		expect(hex(after.local!.raw)).not.toBe(hex(before.local!.raw));
		expect(hex(after.remote[0].raw)).not.toBe(hex(before.remote[0].raw));

		const rejoin = await bob.joinExternal(await alice.groupInfo());

		await relay(rejoin, bob, [ alice ]);
		expect(changed).toEqual([]);
		await inSync([ alice, bob ]);
	});

	it('reuses a freed leaf for a newcomer without reusing a key identifier', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');
		const carol = await provider('carol');
		const dave = await provider('dave');

		await relay(await bob.joinExternal(await alice.found('room')), bob, [ alice ]);

		const carolJoin = await carol.joinExternal(await alice.groupInfo());

		await relay(carolJoin, carol, [ alice, bob ]);

		const bobKeys = await bob.frameKeys();
		const removal = await alice.commitRemove([ 'bob' ]);

		await relay(removal!, alice, [ carol ]);

		const daveJoin = await dave.joinExternal(await alice.groupInfo());

		await relay(daveJoin, dave, [ alice, carol ]);

		expect(dave.myLeafIndex).toBe(bob.myLeafIndex);

		const daveKeys = await dave.frameKeys();

		expect(daveKeys.local!.keyId >>> 8).toBe(bobKeys.local!.keyId >>> 8);
		expect(daveKeys.local!.keyId).not.toBe(bobKeys.local!.keyId);
		await inSync([ alice, carol, dave ]);
	});

	it('wraps the epoch byte after 256 commits without repeating a key', async () => {
		const alice = await provider('alice');
		const bob = await provider('bob');

		await relay(await bob.joinExternal(await alice.found('room')), bob, [ alice ]);

		const first = await alice.frameKeys();

		expect(first.epoch).toBe(1);

		for (let i = 0; i < 256; i++) await relay(await alice.commitUpdate(), alice, [ bob ]);

		const wrapped = await alice.frameKeys();

		expect(wrapped.epoch).toBe(257);
		expect(wrapped.local!.keyId).toBe(first.local!.keyId);
		expect(hex(wrapped.local!.raw)).not.toBe(hex(first.local!.raw));
		await inSync([ alice, bob ]);
	}, 60000);
});
