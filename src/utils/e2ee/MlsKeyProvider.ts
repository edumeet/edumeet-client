import {
	acceptAll,
	createCommit,
	createGroup,
	createGroupInfoWithExternalPubAndRatchetTree,
	decode,
	defaultCredentialTypes,
	defaultProposalTypes,
	encode,
	generateKeyPackage,
	generateKeyPackageWithKey,
	getCiphersuiteImpl,
	joinGroup,
	joinGroupExternal,
	mlsExporter,
	mlsMessageDecoder,
	mlsMessageEncoder,
	nodeTypes,
	processMessage,
	protocolVersions,
	wireformats,
	type AuthenticationService,
	type ClientState,
	type Credential,
	type CredentialBasic,
	type GroupInfo,
	type MlsContext,
	type MlsMessage,
	type Proposal,
} from 'ts-mls';
import { Bytes, fromB64, importMediaKey, toB64 } from './crypto';
import { Logger } from '../Logger';

const logger = new Logger('MlsKeyProvider');

// One suite for every member of a group. X25519 with Ed25519 is the one every browser can run:
// Firefox cannot export a P-256 key derived from a secret, which the library does for every init
// and path key, and it is also the faster suite in every browser measured.
export const MLS_SUITE = 'MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519';

// The frame key identifier the worker sees is namespace(24) | epoch(8), with the sender's leaf index
// as the namespace, which is the RFC 9605 KID layout with 16 sender bits, 8 epoch bits and no context.
const EPOCH_BITS = 8n;
const SFRAME_SUITE_AES_GCM_256 = 4;

const isBasic = (credential: Credential): credential is CredentialBasic =>
	credential.credentialType === defaultCredentialTypes.basic && 'identity' in credential;

const sameIdentity = (a: CredentialBasic, b: CredentialBasic): boolean =>
	a.identity.length === b.identity.length && a.identity.every((byte, i) => byte === b.identity[i]);

export interface Member {
	peerId: string;
	leafIndex: number;
}

export interface FrameKey {
	keyId: number;
	key: CryptoKey;
	raw: Bytes;
}

export interface RemoteFrameKey extends FrameKey {
	peerId: string;
	leafIndex: number;
}

export interface EpochKeys {
	epoch: number;
	local?: FrameKey;
	remote: RemoteFrameKey[];
}

// A commit the server has not accepted yet. The state it produces is installed by accept() only when
// the server says the commit won, because the server orders commits and a refused one must leave
// no trace: the winner's commit arrives moments later and applies to the state we kept.
export interface PendingCommit {
	epoch: number;
	commit: string;
	groupInfo: string;
	state: ClientState;
}

const text = new TextEncoder();
const utf8 = new TextDecoder();
const b64 = (bytes: Uint8Array): string => toB64(bytes as Bytes);
const hex = (bytes: Uint8Array): string => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

export class MlsKeyProvider {
	readonly #myPeerId: string;
	#context?: MlsContext;
	#keyPackage?: Awaited<ReturnType<typeof generateKeyPackage>>;
	#state?: ClientState;
	readonly #pins = new Map<string, string>();

	// A member's signature key changed under a peer id we had already seen. Peer ids are not reused
	// and a returning member keeps its key pair, so this is the same signal the pairwise design
	// raises as a changed identity: worth a warning, not a reason to drop out of the group.
	// eslint-disable-next-line no-unused-vars
	onIdentityChanged?: (peerId: string) => void;

	constructor(myPeerId: string) {
		this.#myPeerId = myPeerId;
	}

	async init(): Promise<void> {
		const cipherSuite = await getCiphersuiteImpl(MLS_SUITE);

		this.#context = { cipherSuite, authService: this.#trustOnFirstUse() };
		this.#keyPackage = await generateKeyPackage({ credential: this.#credential(), cipherSuite });
	}

	get peerId(): string {
		return this.#myPeerId;
	}

	reset(): void {
		this.#state = undefined;
	}

	get joined(): boolean {
		return this.#state !== undefined;
	}

	get epoch(): number {
		return this.#state ? Number(this.#state.groupContext.epoch) : -1;
	}

	get myLeafIndex(): number {
		return this.#state?.privatePath.leafIndex ?? -1;
	}

	keyPackage(): string {
		const { publicPackage } = this.#required().keyPackage;

		return b64(encode(mlsMessageEncoder, { wireformat: wireformats.mls_key_package, keyPackage: publicPackage, version: protocolVersions.mls10 }));
	}

	async found(groupId: string): Promise<string> {
		const { context, keyPackage } = this.#required();

		this.#state = await createGroup({
			context,
			groupId: text.encode(groupId),
			keyPackage: keyPackage.publicPackage,
			privateKeyPackage: keyPackage.privatePackage,
		});

		logger.debug('group founded [groupId:%s]', groupId);

		return this.groupInfo();
	}

	async groupInfo(): Promise<string> {
		const { context } = this.#required();
		const state = this.#joinedState();
		const groupInfo = await createGroupInfoWithExternalPubAndRatchetTree(state, [], context.cipherSuite);

		return b64(encode(mlsMessageEncoder, { wireformat: wireformats.mls_group_info, groupInfo, version: protocolVersions.mls10 }));
	}

	async joinExternal(groupInfoB64: string): Promise<PendingCommit> {
		const message = this.#decode(groupInfoB64);

		if (message.wireformat !== wireformats.mls_group_info) throw new Error('expected a GroupInfo');

		// A resync replaces the leaf a previous incarnation of ours left behind, matched by signature
		// key, so a rejoin after losing the group state reuses the pair generated at init. If nothing
		// of ours is in the tree any more, the others removed it already, and a plain join is right.
		if (this.#state !== undefined) {
			try {
				return await this.#externalJoin(message.groupInfo, true);
			} catch (error) {
				logger.debug('no leaf of ours to resync, joining afresh [error:%o]', error);
			}
		}

		return this.#externalJoin(message.groupInfo, false);
	}

	async #externalJoin(groupInfo: GroupInfo, resync: boolean): Promise<PendingCommit> {
		const { context } = this.#required();
		const keyPackage = await this.#freshKeyPackage();
		const result = await joinGroupExternal({
			context,
			groupInfo,
			keyPackage: keyPackage.publicPackage,
			privateKeys: keyPackage.privatePackage,
			resync,
		});

		return this.#pending(Number(groupInfo.groupContext.epoch), result.commit, result.newState);
	}

	async applyWelcome(welcomeB64: string): Promise<void> {
		const { context, keyPackage } = this.#required();
		const message = this.#decode(welcomeB64);

		if (message.wireformat !== wireformats.mls_welcome) throw new Error('expected a Welcome');

		this.#state = await joinGroup({
			context,
			welcome: message.welcome,
			keyPackage: keyPackage.publicPackage,
			privateKeys: keyPackage.privatePackage,
		});
	}

	async applyCommit(commitB64: string): Promise<void> {
		const { context } = this.#required();
		const state = this.#joinedState();
		const message = this.#decode(commitB64);

		if (message.wireformat !== wireformats.mls_private_message && message.wireformat !== wireformats.mls_public_message)
			throw new Error('expected a commit');

		const result = await processMessage({ context, state, message, callback: acceptAll });

		this.#state = result.newState;
	}

	async commitRemove(peerIds: string[]): Promise<PendingCommit | undefined> {
		const { context } = this.#required();
		const state = this.#joinedState();
		const present = new Set(peerIds);
		const proposals: Proposal[] = this.members()
			.filter((m) => present.has(m.peerId))
			.map((m) => ({ proposalType: defaultProposalTypes.remove, remove: { removed: m.leafIndex } }));

		if (proposals.length === 0) return undefined;

		const result = await createCommit({ context, state, extraProposals: proposals });

		return this.#pending(this.epoch, result.commit, result.newState);
	}

	async commitUpdate(): Promise<PendingCommit> {
		const { context } = this.#required();
		const result = await createCommit({ context, state: this.#joinedState() });

		return this.#pending(this.epoch, result.commit, result.newState);
	}

	accept(pending: PendingCommit): void {
		this.#state = pending.state;
	}

	members(): Member[] {
		const state = this.#joinedState();
		const members: Member[] = [];

		state.ratchetTree.forEach((node, index) => {
			if (index % 2 !== 0 || node === undefined || node.nodeType !== nodeTypes.leaf) return;

			const { credential } = node.leaf;

			if (!isBasic(credential)) return;

			members.push({ peerId: utf8.decode(credential.identity), leafIndex: index / 2 });
		});

		return members;
	}

	// Departures are committed by one member so that a room does not produce a commit per remaining
	// member. The lowest leaf index still present is that member, rank 0; the others step in after a
	// timeout in rank order if it is slow or gone. Minus one means we are not in the group.
	committerRank(departed: Set<string>): number {
		const remaining = this.members()
			.filter((m) => !departed.has(m.peerId))
			.map((m) => m.leafIndex)
			.sort((a, b) => a - b);

		return remaining.indexOf(this.myLeafIndex);
	}

	isCommitter(departed: Set<string>): boolean {
		return this.committerRank(departed) === 0;
	}

	// RFC 9605 section 5.2: one base key per epoch from the exporter, one key per sender derived
	// from it under the sender's KID. Only the key is derived here: the worker builds its own nonce
	// from the key identifier and a counter, so the salt the RFC also derives is not needed.
	async frameKeys(): Promise<EpochKeys> {
		const { context } = this.#required();
		const state = this.#joinedState();
		const epoch = Number(state.groupContext.epoch);
		const base = await mlsExporter(state.keySchedule.exporterSecret, 'SFrame 1.0 Base Key', new Uint8Array(0), 32, context.cipherSuite);
		const ikm = await globalThis.crypto.subtle.importKey('raw', base as Bytes, 'HKDF', false, [ 'deriveBits' ]);
		const derive = async (leafIndex: number): Promise<FrameKey> => {
			const kid = (BigInt(leafIndex) << EPOCH_BITS) + (BigInt(epoch) % (1n << EPOCH_BITS));
			const label = text.encode('SFrame 1.0 Secret key ');
			const info = new Uint8Array(label.length + 8 + 2);
			const view = new DataView(info.buffer);

			info.set(label, 0);
			view.setBigUint64(label.length, kid);
			view.setUint16(label.length + 8, SFRAME_SUITE_AES_GCM_256);

			const raw = new Uint8Array(await globalThis.crypto.subtle.deriveBits(
				{ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info }, ikm, 256)) as Bytes;

			return { keyId: Number(kid) >>> 0, key: await importMediaKey(raw), raw };
		};

		const remote: RemoteFrameKey[] = [];
		let local: FrameKey | undefined;
		const members = this.members();
		const keys = await Promise.all(members.map((member) => derive(member.leafIndex)));

		for (const [ i, member ] of members.entries()) {
			const key = keys[i];

			if (member.peerId === this.#myPeerId && member.leafIndex === this.myLeafIndex) local = key;
			else remote.push({ ...key, ...member });
		}

		if (!local) logger.warn('our own leaf is not in the group [epoch:%d]', epoch);

		return { epoch, local, remote };
	}

	#credential() {
		return { credentialType: defaultCredentialTypes.basic, identity: text.encode(this.#myPeerId) };
	}

	#trustOnFirstUse(): AuthenticationService {
		return {
			validateCredential: async (credential, signaturePublicKey) => {
				if (!isBasic(credential)) return false;

				const peerId = utf8.decode(credential.identity);
				const key = hex(signaturePublicKey);
				const pinned = this.#pins.get(peerId);

				if (pinned !== undefined && pinned !== key) {
					logger.warn('signature key changed for a known peer [peerId:%s]', peerId);
					this.onIdentityChanged?.(peerId);
				}

				this.#pins.set(peerId, key);

				return true;
			},
			validateSuccessorCredential: async (oldCredential, newCredential) =>
				isBasic(oldCredential) && isBasic(newCredential) && sameIdentity(oldCredential, newCredential),
		};
	}

	async #freshKeyPackage() {
		const { context, keyPackage } = this.#required();

		return generateKeyPackageWithKey({
			credential: this.#credential(),
			cipherSuite: context.cipherSuite,
			signatureKeyPair: {
				signKey: keyPackage.privatePackage.signaturePrivateKey,
				publicKey: keyPackage.publicPackage.leafNode.signaturePublicKey,
			},
		});
	}

	#pending(epoch: number, commit: MlsMessage, state: ClientState): Promise<PendingCommit> {
		const { context } = this.#required();

		return (async () => ({
			epoch,
			commit: b64(encode(mlsMessageEncoder, commit)),
			groupInfo: b64(encode(mlsMessageEncoder, {
				wireformat: wireformats.mls_group_info,
				groupInfo: await createGroupInfoWithExternalPubAndRatchetTree(state, [], context.cipherSuite),
				version: protocolVersions.mls10,
			})),
			state,
		}))();
	}

	#decode(encoded: string) {
		const message = decode(mlsMessageDecoder, fromB64(encoded));

		if (!message) throw new Error('undecodable MLS message');

		return message;
	}

	#required() {
		if (!this.#context || !this.#keyPackage) throw new Error('MlsKeyProvider not initialised');

		return { context: this.#context, keyPackage: this.#keyPackage };
	}

	#joinedState(): ClientState {
		if (!this.#state) throw new Error('not in a group');

		return this.#state;
	}
}
