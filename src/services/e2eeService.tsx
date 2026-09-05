import { WebCryptoKeyProvider } from '../utils/e2ee/WebCryptoKeyProvider';
import { IdentityStatus, LocalKey, WrappedKeyMessage } from '../utils/e2ee/E2eeKeyProvider';
import { Bytes, peerNamespace } from '../utils/e2ee/crypto';
import { Logger } from '../utils/Logger';
import { browserInfo } from '../utils/deviceInfo';

const logger = new Logger('E2eeService');

// How long a transform may go without handling a frame, measured from the moment media could
// actually flow, before we treat the browser as not encrypting. The clock deliberately does NOT start
// at attach: nothing is sent until the transport connects, so counting from there would punish a slow
// ICE negotiation. Once connected a healthy transform sees its first frame within tens of
// milliseconds, so this only has to cover jitter. Nothing unprotected is sent while it runs -- the
// sender holds the track until the transform confirms -- so this bounds how long a user sits in a
// room that will not work, not how long plaintext escapes.
const ENCRYPTION_VERIFY_MS = 3000;

// Upper bound on how long a sender waits for its own transform to confirm before giving up on that
// stream. This is a hang guard, not a security bound: the guarantee comes from never enabling the
// track without confirmation, so this only has to stop an await lasting forever. It is deliberately
// generous, because the wait starts before the transport connects and a slow ICE negotiation must
// never be mistaken for a browser that refuses to encrypt.
const PROTECTION_WAIT_MS = 30000;

// eslint-disable-next-line no-unused-vars
type ProtectionWaiter = (confirmed: boolean) => void;

// Never fall back to 'opus' for an unrecognised mimeType: the worker splits audio at 1 clear byte
// and video at 3 or 10, so mislabelling a video stream as audio desynchronises encrypt from decrypt
// and every frame is dropped with no error. An unknown codec gets its own value, which lands on the
// worker's 3-byte branch and stays symmetric on both sides.
const normalizeCodec = (mime?: string): string => {
	const c = (mime || '').toLowerCase();

	if (c.includes('vp9')) return 'vp9';
	if (c.includes('vp8')) return 'vp8';
	if (c.includes('h264')) return 'h264';
	if (c.includes('opus') || c.startsWith('audio/')) return 'opus';

	logger.warn('normalizeCodec() unrecognised mimeType [mime:%s]', mime);

	return 'unknown';
};

// Owns the encrypt/decrypt workers + the key provider, and attaches the RTCRtpScriptTransform to our
// senders/receivers. The signaling middleware drives key exchange; the media pipeline calls
// protectSender()/protectReceiver() right after produce()/consume().
export class E2eeService {
	#enabled = false;
	#provider?: WebCryptoKeyProvider;
	#encWorker?: Worker;
	#decWorker?: Worker;
	#readyResolve!: () => void;
	readonly #ready: Promise<void> = new Promise((resolve) => { this.#readyResolve = resolve; });

	get enabled(): boolean {
		return this.#enabled;
	}

	async enable(myPeerId: string): Promise<void> {
		if (this.#enabled) return;

		this.#enabled = true; // mark intent synchronously so protectSender/Receiver await readiness
		logger.debug('E2EE ENABLED — outgoing/incoming media in this room will be encrypted [peerId: %s]', myPeerId);

		this.#provider = new WebCryptoKeyProvider(myPeerId);
		await this.#provider.init();

		this.#encWorker = new Worker(new URL('../utils/e2ee/sframeWorker.ts', import.meta.url), { type: 'module' });
		this.#decWorker = new Worker(new URL('../utils/e2ee/sframeWorker.ts', import.meta.url), { type: 'module' });

		// The worker has no console of its own worth reading across engines, so it reports frame-level
		// diagnostics back here. Log the engine alongside them: a cross-browser problem is only legible
		// when you can pair each stream's numbers with the browser that produced them.
		logger.debug('E2EE worker diagnostics enabled [engine:%s, browser:%s %s]',
			browserInfo.getEngineName(),
			browserInfo.getBrowserName(), browserInfo.getBrowserVersion());

		this.#encWorker.onmessage = this.#onWorkerDiag;
		this.#decWorker.onmessage = this.#onWorkerDiag;

		this.#pushLocalKey();
		this.#readyResolve();
	}

	#encryptVerified = false;
	#protectionActive = false;
	#transformAttached = false;
	#mediaFlowPossible = false;
	#tidSeq = 0;
	// transform id -> the sender waiting for that specific transform to prove it is handling frames.
	// This is per transform on purpose: a single shared promise would release a later producer, a
	// screen share say, on confirmation that belonged to the first one.
	#pendingProtection = new Map<number, ProtectionWaiter>();
	#verifyTimer?: ReturnType<typeof setTimeout>;
	#unverifiedReported = false;

	// Set by the e2ee middleware. Fired when E2EE is on but nothing is actually being encrypted, so
	// the app can stop presenting the room as protected rather than silently sending plaintext.
	onEncryptionUnverified?: () => void;

	// Fired once, when a frame has demonstrably been encrypted or decrypted.
	onEncryptionVerified?: () => void;

	readonly #namespaces = new Map<number, string>(); // media key namespace -> peerId
	#localKeyUsed = false; // has anything been encrypted under the key we currently hold

	// A peer whose media we cannot decrypt, either because their key never reached us or because we
	// have fallen too far behind their advances. The worker only sees namespaces, so the peer is
	// resolved here and the caller decides how to ask.
	// eslint-disable-next-line no-unused-vars
	onKeyNeeded?: (peerId: string) => void;

	get encryptionVerified(): boolean {
		return this.#encryptVerified;
	}

	// Resolves true once THIS transform has handled a frame, false if it never does. A sender must not
	// release real media on anything less.
	whenProtectionActive(tid?: number): Promise<boolean> {
		// Nothing to wait for when E2EE is off: senders in that case never hold their track anyway.
		if (!this.#enabled) return Promise.resolve(true);

		// With E2EE on, no transform id means no transform was attached, which is a failure and must
		// not read as success. Returning true here would release real media with nothing protecting it,
		// which is the fail-open this whole design exists to avoid.
		if (typeof tid !== 'number') {
			logger.error('E2EE is on but no transform was attached, refusing to release media');

			return Promise.resolve(false);
		}

		return new Promise<boolean>((resolve) => {
			const timer = setTimeout(() => {
				this.#pendingProtection.delete(tid);
				logger.error('E2EE transform never handled a frame, leaving the track disabled [tid:%d]', tid);
				resolve(false);
			}, PROTECTION_WAIT_MS);

			this.#pendingProtection.set(tid, (confirmed) => {
				clearTimeout(timer);
				resolve(confirmed);
			});
		});
	}

	// Called when the sending transport connects, i.e. the first moment a frame could reach the
	// transform. Starts the watchdog clock so a slow ICE negotiation is never mistaken for a browser
	// that refuses to encrypt.
	notifyMediaFlowPossible(): void {
		this.#mediaFlowPossible = true;
		this.#startEncryptionWatchdog();
	}

	#onWorkerDiag = (e: MessageEvent): void => {
		const d = e.data;

		if (d?.type !== 'e2eeDiag') return;

		if (d.event === 'pipeLive' && d.op === 'encrypt') {
			const waiter = this.#pendingProtection.get(d.id);

			if (waiter) {
				this.#pendingProtection.delete(d.id);
				waiter(true);
			}

			// The watchdog only asks whether this browser encrypts at all, so the first confirmation
			// settles it; a later transform that stalls is handled by its own waiter above.
			if (!this.#protectionActive) {
				this.#protectionActive = true;
				if (this.#verifyTimer) clearTimeout(this.#verifyTimer);
			}
		}

		if (d.event === 'encKeyUsed' && (d.keyId >>> 0) === this.#provider?.localKey()?.keyId) this.#localKeyUsed = true;

		if (d.event === 'keyNeeded') {
			const peerId = this.#namespaces.get(d.namespace >>> 0);

			// An unknown namespace is not a peer: a clear-byte disagreement parses ciphertext as a
			// header and produces key identifiers that belong to nobody. Nothing to ask, so ignore it.
			if (peerId) this.onKeyNeeded?.(peerId);
		}

		// Either direction counts here: successfully decrypting a peer proves the crypto is working just
		// as well as encrypting our own media, and a receive-only participant has nothing to encrypt --
		// keying this on the send side left their badge saying "not confirmed" for the whole call. The
		// watchdog below stays encrypt-only on purpose: it exists to stop OUR media leaking, and a
		// participant who is not sending has nothing to leak.
		if (d.event === 'firstFrame' && !this.#encryptVerified) {
			this.#encryptVerified = true;
			this.onEncryptionVerified?.();
		}

		const { type, level, ...rest } = d;

		void type;
		// JSON rather than an object: the console only sometimes inlines an object into the text it
		// saves, and a report written as the word "Object" is a report lost.
		if (level === 'warn') logger.warn('E2EE worker %j', rest);
		else logger.debug('E2EE worker %j', rest);
	};

	#startEncryptionWatchdog(): void {
		if (this.#verifyTimer || this.#protectionActive) return;
		if (!this.#transformAttached || !this.#mediaFlowPossible) return;

		this.#verifyTimer = setTimeout(() => {
			this.#verifyTimer = undefined;
			if (this.#protectionActive || this.#unverifiedReported || !this.#enabled) return;

			this.#unverifiedReported = true;
			logger.error('E2EE is enabled and a transform is attached, but it has not processed a single frame after %dms — this browser is not encrypting', ENCRYPTION_VERIFY_MS);
			this.onEncryptionUnverified?.();
		}, ENCRYPTION_VERIFY_MS);
	}

	// ---- media pipeline: attach transforms ----
	async protectSender(sender?: RTCRtpSender, codecMime?: string): Promise<number | undefined> {
		if (!this.#enabled || !sender) return undefined;
		await this.#ready;

		return this.#attach(sender, 'encrypt', codecMime);
	}

	async protectReceiver(receiver?: RTCRtpReceiver, codecMime?: string): Promise<number | undefined> {
		if (!this.#enabled || !receiver) return undefined;
		await this.#ready;

		return this.#attach(receiver, 'decrypt', codecMime);
	}

	#attach(target: RTCRtpSender | RTCRtpReceiver, operation: 'encrypt' | 'decrypt', codecMime?: string): number | undefined {
		const worker = operation === 'encrypt' ? this.#encWorker : this.#decWorker;

		if (!worker) return undefined;

		// RTCRtpScriptTransform / .transform are not in the DOM lib version here — use loose typing.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const Transform = (globalThis as any).RTCRtpScriptTransform;
		const tid = ++this.#tidSeq;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(target as any).transform = new Transform(worker, { operation, codec: normalizeCodec(codecMime), tid });

		logger.debug('E2EE %s transform attached [tid:%d, codec:%s] — awaiting confirmation that frames are actually encrypted',
			operation, tid, normalizeCodec(codecMime));

		if (operation === 'encrypt') {
			this.#transformAttached = true;
			this.#startEncryptionWatchdog();
		}

		return tid;
	}

	// ---- signaling middleware: key exchange delegation ----
	getIdentityPublicKey(): Promise<Bytes> {
		return this.#provider!.getIdentityPublicKey();
	}

	hasPeer(peerId: string): boolean {
		return this.#provider?.hasPeer(peerId) ?? false;
	}

	async addPeer(peerId: string, identityPubKey: Bytes): Promise<IdentityStatus> {
		const status = await this.#provider!.addPeer(peerId, identityPubKey);

		this.#namespaces.set(await peerNamespace(peerId), peerId);

		return status;
	}

	removePeer(peerId: string): void {
		this.#provider?.removePeer(peerId);

		// The worker holds this peer's media keys and knows nothing about peers, so tell it to drop
		// them. Otherwise they stay valid for the rest of the session and old frames remain replayable.
		// The namespace was recorded when the peer was added, so this needs no await: hashing it again
		// would leave a gap in which a request for a key could still name a peer who has gone.
		for (const [ namespace, id ] of this.#namespaces) {
			if (id !== peerId) continue;

			this.#namespaces.delete(namespace);
			this.#decWorker?.postMessage({ type: 'dropKeys', namespace });
		}
	}

	wrapLocalKeyFor(peerId: string): Promise<WrappedKeyMessage> {
		return this.#provider!.wrapLocalKeyFor(peerId);
	}

	wrapLocalKeyForAll(): Promise<WrappedKeyMessage[]> {
		return this.#provider!.wrapLocalKeyForAll();
	}

	async rotateLocalKey(): Promise<void> {
		await this.#provider!.rotateLocalKey();
		this.#pushLocalKey();
	}

	// Advancing hides what was sent before a newcomer arrived. With nothing sent under the current key
	// there is nothing to hide, and advancing anyway would only put us further ahead of the peers who
	// have had no frames from us to follow, which is exactly the participant this protects: mic and
	// camera off through a run of arrivals, then unmuting into a room that can no longer read them.
	async ratchetLocalKey(): Promise<void> {
		if (!this.#localKeyUsed) {
			logger.debug('nothing sent under the current key, keeping it rather than advancing');

			return;
		}

		await this.#provider!.ratchetLocalKey();
		this.#pushLocalKey(true);
	}

	async onRemoteKey(fromPeerId: string, keyId: number, iv: Bytes, data: ArrayBuffer): Promise<void> {
		const update = await this.#provider!.unwrapRemoteKey(fromPeerId, keyId, iv, data);

		// Logged here as well as in the worker so a gap between the two can be attributed to one side.
		logger.debug('remote key unwrapped, handing it to the worker [keyId:%d]', update.keyId);
		this.#decWorker?.postMessage({ type: 'decKey', keyId: update.keyId, key: update.key, raw: update.raw });
	}

	#pushLocalKey(ratcheted = false): void {
		const lk: LocalKey | undefined = this.#provider?.localKey();

		this.#localKeyUsed = false;
		if (lk) this.#encWorker?.postMessage({ type: 'encKey', keyId: lk.keyId, key: lk.key, ratcheted });
	}
}
