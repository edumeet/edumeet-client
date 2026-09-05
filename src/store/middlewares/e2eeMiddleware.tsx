import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { peersActions } from '../slices/peersSlice';
import { roomActions } from '../slices/roomSlice';
import { e2eeActions } from '../slices/e2eeSlice';
import { notificationsActions } from '../slices/notificationsSlice';
import { isInsertableStreamsSupported } from '../selectors';
import { peerIdentityChangedLabel, roomE2eeFailedLabel } from '../../components/translated/translatedComponents';
import { JOIN_ERROR_KEY } from './roomMiddleware';
import { fromB64, toB64 } from '../../utils/e2ee/crypto';
import { Logger } from '../../utils/Logger';

const logger = new Logger('E2eeMiddleware');

// Zero-trust per-sender key exchange over the existing signaling relay. On join we announce our
// identity; on first contact with a peer we derive a pairwise KEK and send our (wrapped) media key;
// on leave we replace our key and redistribute it, on join we advance it and send it only to the
// newcomer. The E2eeService owns the keys/workers; this just routes signals.
const createE2eeMiddleware = ({ signalingService, e2eeService, mediaService }: MiddlewareOptions): Middleware => {
	logger.debug('createE2eeMiddleware()');

	const announceIdentity = async (toPeerId?: string): Promise<void> => {
		signalingService.notify('e2eeIdentity', {
			identityPubKey: toB64(await e2eeService.getIdentityPublicKey()),
			...(toPeerId ? { toPeerId } : {}),
		});
	};

	const sendKeyTo = async (peerId: string): Promise<void> => {
		if (!e2eeService.hasPeer(peerId)) return;

		const msg = await e2eeService.wrapLocalKeyFor(peerId);

		signalingService.notify('e2eeKey', {
			toPeerId: peerId, keyId: msg.keyId, iv: toB64(msg.iv), data: toB64(msg.data),
		});
	};

	const sendKeyToAll = async (): Promise<void> => {
		for (const msg of await e2eeService.wrapLocalKeyForAll()) {
			signalingService.notify('e2eeKey', {
				toPeerId: msg.toPeerId, keyId: msg.keyId, iv: toB64(msg.iv), data: toB64(msg.data),
			});
		}
	};

	// A peer arriving must not be able to read what was said before they came, so our key is advanced
	// before they are sent it. Advancing is one way, so everyone already holding the key derives the
	// next one themselves and only the newcomer needs a message.
	//
	// Arrivals are batched because joining a room produces one first contact per peer already there,
	// and advancing once each would burn an epoch per peer and re-send to everyone met so far. One
	// advance covers any number of peers that arrive together.
	//
	// A peer only learns that our key advanced by decrypting a frame under it, so anyone receiving no
	// frames from us stays where it was: we are muted, or the SFU is not forwarding our video to them
	// because they are not showing us. Those peers are recovered on demand rather than pre-emptively,
	// by the request below, so advancing stays free no matter how large the room is.
	const JOIN_BATCH_MS = 200;
	const arriving = new Set<string>();
	let arrivalTimer: ReturnType<typeof setTimeout> | undefined;

	const scheduleArrival = (peerId: string): void => {
		arriving.add(peerId);

		if (arrivalTimer) return;

		arrivalTimer = setTimeout(() => {
			arrivalTimer = undefined;

			const peers = [ ...arriving ];

			arriving.clear();

			void (async () => {
				if (!e2eeService.enabled) return;

				try {
					await e2eeService.ratchetLocalKey();

					for (const id of peers) await sendKeyTo(id);
				} catch (error) {
					logger.error('advancing our key for arriving peers failed [error:%o]', error);
				}
			})();
		}, JOIN_BATCH_MS);
	};

	// A departure burns our key, because the leaver holds it. Replacing it costs a message per remaining
	// peer, and every remaining peer does the same, so a room emptying pays that per person. Two things
	// keep it in check. Departures are batched like arrivals, so people leaving together cost one
	// replacement, at the price of the leaver being able to read up to the batch window. And a
	// participant with no producer has nothing the leaver could read, so it only marks its key as
	// burned and replaces it when it next starts sending, which in a lecture is most of the room.
	const LEAVE_BATCH_MS = 200;
	let departureTimer: ReturnType<typeof setTimeout> | undefined;

	const hasProducer = (): boolean =>
		Object.values(mediaService.mediaSenders).some((sender) => Boolean(sender.producer));

	const replaceAndDistribute = async (): Promise<void> => {
		await e2eeService.rotateLocalKey();
		await sendKeyToAll();
	};

	const scheduleDeparture = (): void => {
		if (departureTimer) return;

		departureTimer = setTimeout(() => {
			departureTimer = undefined;

			void (async () => {
				if (!e2eeService.enabled) return;

				try {
					await replaceAndDistribute();
				} catch (error) {
					logger.error('replacing our key after a departure failed [error:%o]', error);
				}
			})();
		}, LEAVE_BATCH_MS);
	};

	// Asking a peer for their key. There is no request message and none is needed: a peer that already
	// knows us reads a repeat identity announcement as a request, since nothing else would prompt one.
	// That keeps recovery on the two notifications the room server already relays.
	//
	// Answering is throttled so that a peer announcing repeatedly cannot turn into a flood of keys.
	const RESEND_THROTTLE_MS = 2000;
	const lastResend = new Map<string, number>();

	const answerKeyRequest = async (peerId: string): Promise<void> => {
		const now = Date.now();

		if (now - (lastResend.get(peerId) ?? 0) < RESEND_THROTTLE_MS) return;

		lastResend.set(peerId, now);

		await sendKeyTo(peerId);
	};

	// An e2eeKey can arrive before we've finished deriving that sender's KEK (their addPeer/ECDH is
	// still in flight — common cross-browser since Firefox's WebCrypto is slower). Buffer such keys by
	// sender and apply them once the KEK lands, instead of dropping them with "no KEK for peer".
	const pendingKeys = new Map<string, Array<{ keyId: number; iv: string; data: string }>>();

	let unverifiedHandlerWired = false;

	// Attaching a transform is not the same as encrypting. If the browser accepts the transform and
	// then never runs it, we would sit in a room shown as protected while sending plaintext. Treat
	// that as a refusal to stay, the same way an unsupported browser is refused at join.
	const wireUnverifiedHandler = (dispatch: AppDispatch): void => {
		if (unverifiedHandlerWired) return;
		unverifiedHandlerWired = true;

		// A key burned by a departure while we had nothing to send is replaced by the service the moment
		// a producer starts; distributing the replacement is signalling, so it comes back through here.
		e2eeService.onRotateRequired = replaceAndDistribute;

		// The worker could not decrypt this peer for a sustained run of frames: their key never reached
		// us, or we fell further behind their advances than we will derive. Announcing to them asks for
		// a key, and is rate limited in the worker so this cannot become a loop.
		e2eeService.onKeyNeeded = (peerId: string) => {
			logger.debug('cannot decrypt a peer, asking for their key [peerId:%s]', peerId);

			void announceIdentity(peerId);
		};

		e2eeService.onEncryptionVerified = () => {
			logger.debug('E2EE verified — media is genuinely being encrypted');
			dispatch(e2eeActions.setEncryptionVerified(true));
		};

		e2eeService.onEncryptionUnverified = () => {
			logger.error('E2EE could not be verified — leaving the room rather than sending unencrypted media');

			try {
				sessionStorage.setItem(JOIN_ERROR_KEY, roomE2eeFailedLabel());
			} catch { /* sessionStorage may be unavailable (private mode) — still leave */ }

			dispatch(notificationsActions.enqueueNotification({
				message: roomE2eeFailedLabel(),
				options: { variant: 'error', persist: true }
			}));
			dispatch(roomActions.setState('left'));
		};
	};

	return ({ dispatch, getState }: { dispatch: AppDispatch; getState: () => RootState }) =>
		(next) => (action) => {
			wireUnverifiedHandler(dispatch);

			const e2eeActive = (): boolean =>
				Boolean(getState().room.e2eeEnabled) && isInsertableStreamsSupported();

			if (signalingActions.connect.match(action)) {
				signalingService.on('notification', async (notification) => {
					try {
						if (!e2eeActive() || !e2eeService.enabled) return;

						const myPeerId = getState().me.id;

						switch (notification.method) {
							case 'e2eeIdentity': {
								const { peerId, identityPubKey } = notification.data;

								if (!peerId || peerId === myPeerId) return;

								const firstContact = !e2eeService.hasPeer(peerId);

								const status = await e2eeService.addPeer(peerId, fromB64(identityPubKey));

								// KEK is now derived — apply any of this peer's keys that raced ahead of their identity.
								const buffered = pendingKeys.get(peerId);

								if (buffered?.length) {
									pendingKeys.delete(peerId);
									for (const k of buffered) {
										await e2eeService.onRemoteKey(peerId, k.keyId, fromB64(k.iv), fromB64(k.data).buffer);
										dispatch(e2eeActions.setPeerSecured({ peerId }));
									}
								}

								if (status === 'changed') {
									// TOFU violation: the peer's pinned identity key changed mid-session.
									logger.warn('peer identity CHANGED — possible MITM [peerId:%s]', peerId);
									dispatch(e2eeActions.setPeerIdentityChanged({ peerId }));
									dispatch(notificationsActions.enqueueNotification({
										message: peerIdentityChangedLabel(getState().peers[peerId]?.displayName || peerId),
										options: { variant: 'warning', persist: true }
									}));
								}

								if (firstContact) {
									await announceIdentity(peerId);
									scheduleArrival(peerId);
								} else if (status !== 'changed' && !arriving.has(peerId)) {
									// Not a new peer, so this is them asking for our key. Refused when the
									// identity just changed: identities are generated per join and peer ids are
									// not reused, so a changed one for a peer we already know is not a peer
									// reconnecting, and answering would hand our key to whoever supplied it.
									//
									// Also refused while their arrival is still in the batch window. A newcomer
									// answers our announcement with one of their own, which arrives here looking
									// exactly like a request, and answering it would hand them the key from
									// before the advance, which is the key the advance exists to keep from them.
									// The batch sends them the advanced key moments later.
									await answerKeyRequest(peerId);
								}

								break;
							}

							case 'e2eeKey': {
								const { fromPeerId, keyId, iv, data } = notification.data;

								if (!fromPeerId) return;

								// If the sender's KEK isn't ready yet (identity still processing), buffer the
								// key and let the e2eeIdentity handler apply it once addPeer completes.
								if (!e2eeService.hasPeer(fromPeerId)) {
									const q = pendingKeys.get(fromPeerId) ?? [];

									q.push({ keyId, iv, data });
									pendingKeys.set(fromPeerId, q);

									break;
								}

								await e2eeService.onRemoteKey(fromPeerId, keyId, fromB64(iv), fromB64(data).buffer);
								// We can now decrypt this peer's media — mark them secured for the peer list.
								dispatch(e2eeActions.setPeerSecured({ peerId: fromPeerId }));

								break;
							}
						}
					} catch (error) {
						logger.error('e2ee notification error [error:%o]', error);
					}
				});
			}

			// Once fully joined to an E2EE room: spin up the service + announce our identity.
			if (roomActions.setState.match(action) && action.payload === 'joined' && e2eeActive()) {
				void (async () => {
					await e2eeService.enable(getState().me.id);
					await announceIdentity();
				})();
			}

			// Peer left: drop their KEK, then replace our key and redistribute it. Advancing would not do
			// here, because the peer who left can advance it exactly as easily as everyone still present.
			if (peersActions.removePeer.match(action) && e2eeService.enabled) {
				e2eeService.removePeer(action.payload.id);
				dispatch(e2eeActions.removePeer({ peerId: action.payload.id }));
				pendingKeys.delete(action.payload.id);
				lastResend.delete(action.payload.id);

				if (e2eeActive()) {
					if (hasProducer()) scheduleDeparture();
					else e2eeService.markKeyBurned();
				}
			}

			return next(action);
		};
};

export default createE2eeMiddleware;
