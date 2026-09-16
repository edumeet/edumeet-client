import { MlsKeyProvider } from '../utils/e2ee/MlsKeyProvider';
import { Bytes } from '../utils/e2ee/crypto';
import { DecryptKeyStore } from '../utils/e2ee/keyStore';
import { MessageOpener, MessageSealer } from '../utils/e2ee/messageCrypto';
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

// After an epoch change every receiver has to apply the commit, derive the keys and hand them to its
// worker before a frame under the new key is readable. A sender that switches the moment its own
// keys are ready is ahead of them by about that long, and the frames in between are dropped and cost
// a keyframe. So the decrypt keys go out at once and the encrypt key follows after a pause, the
// first key included: a newcomer's first frames reach the others before they have applied its join
// commit just the same, and its own media is held on that key anyway. Nothing leaks in the pause: a
// member who left is no longer forwarded anything, and a newcomer could not read the old key's
// frames either way.
const ENCRYPT_KEY_GRACE_MS = 250;

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

// Owns the encrypt/decrypt workers and the MLS key provider, and attaches the RTCRtpScriptTransform
// to our senders/receivers. The MLS middleware drives the group; the media pipeline calls
// protectSender()/protectReceiver() right after produce()/consume().
export class E2eeService {
	#enabled = false;
	#encWorker?: Worker;
	#decWorker?: Worker;
	#readyResolve!: () => void;
	readonly #ready: Promise<void> = new Promise((resolve) => { this.#readyResolve = resolve; });

	// Data channel messages are sealed and opened on this thread, so the keys the decrypt worker holds
	// are mirrored here and the sender's current key is handed to the sealer whenever the worker gets it.
	readonly #messageKeys = new DecryptKeyStore((namespace) => this.#keyNeeded(namespace));
	readonly #sealer = new MessageSealer();
	readonly #opener = new MessageOpener(this.#messageKeys);

	get enabled(): boolean {
		return this.#enabled;
	}

	// Readiness is deferred to the first applyEpochKeys(), which happens once the group is joined, so
	// a sender holds its media until it has a key to encrypt with.
	async enableMls(myPeerId: string): Promise<MlsKeyProvider> {
		if (this.#mls?.peerId === myPeerId) return this.#mls;

		this.#enabled = true; // mark intent synchronously so protectSender/Receiver await readiness
		logger.debug('E2EE ENABLED with MLS, outgoing/incoming media in this room will be encrypted [peerId: %s]', myPeerId);

		const mls = new MlsKeyProvider(myPeerId);

		await mls.init();
		this.#mls = mls;
		if (!this.#encWorker) this.#startWorkers();

		return mls;
	}

	get mls(): MlsKeyProvider | undefined {
		return this.#mls;
	}

	// Pushes the current epoch's keys to the workers: ours to the encrypter, every other member's to
	// the decrypter, and drops the keys of members no longer in the group. The sender's leaf index is
	// the key namespace, so the worker's namespace map is rebuilt from the membership each time.
	applyEpochKeys(): Promise<void> {
		// Chained so that keys are pushed in order; a failed application is the caller's to see, but it
		// must not leave the chain rejected, or every application after it would be skipped.
		this.#applying = this.#applying.catch(() => undefined).then(() => this.#applyEpochKeysNow());

		return this.#applying;
	}

	// The group has moved on without our leaf in it, so nothing we send can be read: the middleware
	// answers by rejoining.
	onLeafLost?: () => void;

	#applying: Promise<void> = Promise.resolve();

	async #applyEpochKeysNow(): Promise<void> {
		if (!this.#mls?.joined) return;

		const keys = await this.#mls.frameKeys();
		const present = new Set<number>();

		for (const remote of keys.remote) {
			present.add(remote.leafIndex);
			this.#namespaces.set(remote.leafIndex, remote.peerId);
		}

		for (const namespace of [ ...this.#namespaces.keys() ]) {
			if (present.has(namespace)) continue;

			this.#namespaces.delete(namespace);
			this.#decWorker?.postMessage({ type: 'dropKeys', namespace });
			this.#messageKeys.dropNamespace(namespace);
		}

		this.#decWorker?.postMessage({ type: 'decKeys', keys: keys.remote.map(({ keyId, key, raw }) => ({ keyId, key, raw })) });
		for (const { keyId, key, raw } of keys.remote) this.#messageKeys.set(keyId, { key, raw });

		if (!keys.local) {
			this.onLeafLost?.();

			return;
		}

		const local = keys.local;
		const now = Date.now();

		if (this.#pendingEncKey) clearTimeout(this.#pendingEncKey);
		else this.#graceStarted = now;

		// Each commit restarts the pause, but a burst of them must not keep a newcomer waiting: the
		// switch happens no later than twice the pause after the first commit, with the newest key.
		const switchAt = Math.min(now + ENCRYPT_KEY_GRACE_MS, this.#graceStarted + (2 * ENCRYPT_KEY_GRACE_MS));

		this.#pendingEncKey = setTimeout(() => {
			this.#pendingEncKey = undefined;
			this.#encWorker?.postMessage({ type: 'encKey', keyId: local.keyId, key: local.key });
			void this.#sealer.setKey(local.keyId, local.raw);
			this.#readyResolve();
		}, Math.max(0, switchAt - now));

		logger.debug('MLS epoch keys applied [epoch:%d, members:%d]', keys.epoch, keys.remote.length + 1);
	}

	#pendingEncKey?: ReturnType<typeof setTimeout>;
	#graceStarted = 0;

	#mls?: MlsKeyProvider;

	#startWorkers(): void {
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

	// Set by the MLS middleware. Fired when E2EE is on but nothing is actually being encrypted, so
	// the app can stop presenting the room as protected rather than silently sending plaintext.
	onEncryptionUnverified?: () => void;

	// Fired once, when a frame has demonstrably been encrypted or decrypted.
	onEncryptionVerified?: () => void;

	readonly #namespaces = new Map<number, string>(); // media key namespace (leaf index) -> peerId

	// A peer whose media we cannot decrypt because we have not applied the epoch they send under.
	// The worker only sees namespaces, so the peer is resolved here and the caller checks the epoch.
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

		if (d.event === 'keyNeeded') this.#keyNeeded(d.namespace >>> 0);

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

	#keyNeeded(namespace: number): void {
		const peerId = this.#namespaces.get(namespace);

		// An unknown namespace is not a peer: a clear-byte disagreement parses ciphertext as a
		// header and produces key identifiers that belong to nobody. Nothing to ask, so ignore it.
		if (peerId) this.onKeyNeeded?.(peerId);
	}

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

	// A peer left the room. Their keys are dropped at once rather than when the next epoch is
	// applied: otherwise they stay valid until then and old frames remain replayable.
	removePeer(peerId: string): void {
		for (const [ namespace, id ] of this.#namespaces) {
			if (id !== peerId) continue;

			this.#namespaces.delete(namespace);
			this.#decWorker?.postMessage({ type: 'dropKeys', namespace });
			this.#messageKeys.dropNamespace(namespace);
		}
	}

	// ---- data channel messages ----
	// Nothing is returned without a key: the caller drops the message rather than sending it clear.
	async sealMessage(plain: Bytes): Promise<Bytes | undefined> {
		if (!this.#enabled) return undefined;
		await this.#ready;

		return this.#sealer.seal(plain);
	}

	async openMessage(sealed: Bytes): Promise<Bytes | undefined> {
		if (!this.#enabled) return undefined;

		return this.#opener.open(sealed);
	}
}
