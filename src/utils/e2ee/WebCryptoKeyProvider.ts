import { E2eeKeyProvider, IdentityStatus, LocalKey, RemoteKeyUpdate, WrappedKeyMessage } from './E2eeKeyProvider';
import { Bytes, deriveKek, Identity, importMediaKey, makeIdentity, peerNamespace, randomKeyRaw, toB64, unwrapKey, wrapKey } from './crypto';

// Zero-server-trust, WASM-free key provider:
//  - one ephemeral ECDH identity per session (TOFU pinned by peers)
//  - a pairwise KEK per peer (ECDH + HKDF)
//  - one rotating media key for our own outgoing frames, distributed wrapped under each peer's KEK
export class WebCryptoKeyProvider implements E2eeKeyProvider {
	readonly #myPeerId: string;
	#identity?: Identity;
	#namespace = 0;
	#epoch = 0;
	readonly #peers = new Map<string, CryptoKey>(); // peerId -> pairwise KEK
	readonly #pinnedIdentities = new Map<string, string>(); // peerId -> TOFU-pinned identity pubkey (b64)
	#localRaw?: Bytes;
	#local?: LocalKey;

	constructor(myPeerId: string) {
		this.#myPeerId = myPeerId;
	}

	async init(): Promise<void> {
		this.#identity = await makeIdentity();
		this.#namespace = await peerNamespace(this.#myPeerId);
		await this.#freshLocalKey();
	}

	async getIdentityPublicKey(): Promise<Bytes> {
		if (!this.#identity) throw new Error('WebCryptoKeyProvider not initialised');

		return this.#identity.pubRaw;
	}

	hasPeer(peerId: string): boolean {
		return this.#peers.has(peerId);
	}

	async addPeer(peerId: string, identityPubKey: Bytes): Promise<IdentityStatus> {
		if (!this.#identity) throw new Error('WebCryptoKeyProvider not initialised');
		if (peerId === this.#myPeerId) return 'same';

		// TOFU: pin the first identity we see for a peer; flag if a later announce differs.
		const fingerprint = toB64(identityPubKey);
		const pinned = this.#pinnedIdentities.get(peerId);
		const status: IdentityStatus =
			pinned === undefined ? 'new' : pinned === fingerprint ? 'same' : 'changed';

		// Re-pin to the latest so we warn once per distinct change (not on every re-announce),
		// and re-derive the KEK so media stays decryptable (trust-on-update + warn).
		this.#pinnedIdentities.set(peerId, fingerprint);
		this.#peers.set(peerId, await deriveKek(this.#identity.priv, identityPubKey));

		return status;
	}

	removePeer(peerId: string): void {
		this.#peers.delete(peerId);
		this.#pinnedIdentities.delete(peerId);
	}

	localKey(): LocalKey | undefined {
		return this.#local;
	}

	async rotateLocalKey(): Promise<LocalKey> {
		this.#epoch = (this.#epoch + 1) & 0xff;

		return this.#freshLocalKey();
	}

	async wrapLocalKeyFor(peerId: string): Promise<WrappedKeyMessage> {
		const kek = this.#peers.get(peerId);

		if (!kek) throw new Error(`no KEK for peer ${peerId}`);
		if (!this.#localRaw || !this.#local) throw new Error('no local media key');

		const { iv, data } = await wrapKey(kek, this.#localRaw);

		return { toPeerId: peerId, keyId: this.#local.keyId, iv, data };
	}

	async wrapLocalKeyForAll(): Promise<WrappedKeyMessage[]> {
		const out: WrappedKeyMessage[] = [];

		for (const peerId of this.#peers.keys())
			out.push(await this.wrapLocalKeyFor(peerId));

		return out;
	}

	async unwrapRemoteKey(fromPeerId: string, keyId: number, iv: Bytes, data: ArrayBuffer): Promise<RemoteKeyUpdate> {
		const kek = this.#peers.get(fromPeerId);

		if (!kek) throw new Error(`no KEK for peer ${fromPeerId}`);

		// Bind the keyId to its sender: keyId is namespace(24b)|epoch(8b) and namespace is derived
		// from the sender's peerId. Reject a key whose namespace doesn't match the (server-stamped)
		// sender, so a malicious peer can't poison another peer's keyId slot in the decrypt map.
		if ((keyId >>> 8) !== await peerNamespace(fromPeerId))
			throw new Error(`keyId namespace mismatch for peer ${fromPeerId}`);

		const key = await importMediaKey(await unwrapKey(kek, iv, data));

		return { peerId: fromPeerId, keyId, key };
	}

	async #freshLocalKey(): Promise<LocalKey> {
		this.#localRaw = randomKeyRaw();
		this.#local = {
			keyId: ((this.#namespace << 8) | (this.#epoch & 0xff)) >>> 0,
			key: await importMediaKey(this.#localRaw),
		};

		return this.#local;
	}
}
