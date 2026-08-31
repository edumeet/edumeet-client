/* eslint-disable no-unused-vars */
// Pluggable key layer. v1 = WebCryptoKeyProvider (ECDH+HKDF+AES-GCM, no WASM); the same interface
// lets a vodozemac (Olm) or MLS provider drop in later without touching media/signaling/UI.
// (no-unused-vars disabled: this file is interface declarations — param names are for clarity only.)
import { Bytes } from './crypto';

export interface LocalKey {
	keyId: number; // namespace(24b) | epoch(8b); travels in the SFrame header
	key: CryptoKey; // AES-GCM media key for our own outgoing frames
}

export interface RemoteKeyUpdate {
	peerId: string;
	keyId: number;
	key: CryptoKey; // a remote sender's media key, for decrypting their frames
}

export interface WrappedKeyMessage {
	toPeerId: string;
	keyId: number;
	iv: Bytes;
	data: ArrayBuffer; // our media key wrapped under the pairwise KEK (opaque to the server)
}

// TOFU outcome of (re)seeing a peer's identity key:
//  'new'     = first time we see this peer (pin it)
//  'same'    = identity matches the pinned one (benign re-announce)
//  'changed' = identity DIFFERS from the pin — possible MITM/impersonation, warn the user
export type IdentityStatus = 'new' | 'same' | 'changed';

export interface E2eeKeyProvider {
	init(): Promise<void>;
	getIdentityPublicKey(): Promise<Bytes>;

	hasPeer(peerId: string): boolean;
	addPeer(peerId: string, identityPubKey: Bytes): Promise<IdentityStatus>;
	removePeer(peerId: string): void;

	localKey(): LocalKey | undefined;
	rotateLocalKey(): Promise<LocalKey>;

	wrapLocalKeyFor(peerId: string): Promise<WrappedKeyMessage>;
	wrapLocalKeyForAll(): Promise<WrappedKeyMessage[]>;
	unwrapRemoteKey(fromPeerId: string, keyId: number, iv: Bytes, data: ArrayBuffer): Promise<RemoteKeyUpdate>;
}
