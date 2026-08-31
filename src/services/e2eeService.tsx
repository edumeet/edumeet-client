import { WebCryptoKeyProvider } from '../utils/e2ee/WebCryptoKeyProvider';
import { IdentityStatus, LocalKey, WrappedKeyMessage } from '../utils/e2ee/E2eeKeyProvider';
import { Bytes } from '../utils/e2ee/crypto';
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
	#protectionResolve?: () => void;
	// Resolves once an encrypt transform has actually handled a frame. The sender awaits this before
	// releasing real media, so nothing unprotected is ever sent, not even for the watchdog's window.
	#protectionPromise = new Promise<void>((resolve) => { this.#protectionResolve = resolve; });
	#verifyTimer?: ReturnType<typeof setTimeout>;
	#unverifiedReported = false;

	// Set by the e2ee middleware. Fired when E2EE is on but nothing is actually being encrypted, so
	// the app can stop presenting the room as protected rather than silently sending plaintext.
	onEncryptionUnverified?: () => void;

	// Fired once, when a frame has demonstrably been encrypted or decrypted.
	onEncryptionVerified?: () => void;

	get encryptionVerified(): boolean {
		return this.#encryptVerified;
	}

	whenProtectionActive(): Promise<void> {
		return this.#protectionPromise;
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

		if (d.event === 'pipeLive' && d.op === 'encrypt' && !this.#protectionActive) {
			this.#protectionActive = true;
			if (this.#verifyTimer) clearTimeout(this.#verifyTimer);
			this.#protectionResolve?.();
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
		if (level === 'warn') logger.warn('E2EE worker %o', rest);
		else logger.debug('E2EE worker %o', rest);
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
	async protectSender(sender?: RTCRtpSender, codecMime?: string): Promise<void> {
		if (!this.#enabled || !sender) return;
		await this.#ready;
		this.#attach(sender, 'encrypt', codecMime);
	}

	async protectReceiver(receiver?: RTCRtpReceiver, codecMime?: string): Promise<void> {
		if (!this.#enabled || !receiver) return;
		await this.#ready;
		this.#attach(receiver, 'decrypt', codecMime);
	}

	#attach(target: RTCRtpSender | RTCRtpReceiver, operation: 'encrypt' | 'decrypt', codecMime?: string): void {
		const worker = operation === 'encrypt' ? this.#encWorker : this.#decWorker;

		if (!worker) return;

		// RTCRtpScriptTransform / .transform are not in the DOM lib version here — use loose typing.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const Transform = (globalThis as any).RTCRtpScriptTransform;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(target as any).transform = new Transform(worker, { operation, codec: normalizeCodec(codecMime) });

		logger.debug('E2EE %s transform attached [codec: %s] — awaiting confirmation that frames are actually encrypted',
			operation, normalizeCodec(codecMime));

		if (operation === 'encrypt') {
			this.#transformAttached = true;
			this.#startEncryptionWatchdog();
		}
	}

	// ---- signaling middleware: key exchange delegation ----
	getIdentityPublicKey(): Promise<Bytes> {
		return this.#provider!.getIdentityPublicKey();
	}

	hasPeer(peerId: string): boolean {
		return this.#provider?.hasPeer(peerId) ?? false;
	}

	addPeer(peerId: string, identityPubKey: Bytes): Promise<IdentityStatus> {
		return this.#provider!.addPeer(peerId, identityPubKey);
	}

	removePeer(peerId: string): void {
		this.#provider?.removePeer(peerId);
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

	async onRemoteKey(fromPeerId: string, keyId: number, iv: Bytes, data: ArrayBuffer): Promise<void> {
		const update = await this.#provider!.unwrapRemoteKey(fromPeerId, keyId, iv, data);

		this.#decWorker?.postMessage({ type: 'decKey', keyId: update.keyId, key: update.key });
	}

	#pushLocalKey(): void {
		const lk: LocalKey | undefined = this.#provider?.localKey();

		if (lk) this.#encWorker?.postMessage({ type: 'encKey', keyId: lk.keyId, key: lk.key });
	}
}
