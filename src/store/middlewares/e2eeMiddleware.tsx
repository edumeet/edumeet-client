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
// on leave we rotate + redistribute. The E2eeService owns the keys/workers; this just routes signals.
const createE2eeMiddleware = ({ signalingService, e2eeService }: MiddlewareOptions): Middleware => {
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
									await sendKeyTo(peerId);
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

			// Peer left: drop their KEK, then rotate our key + redistribute (forward secrecy).
			if (peersActions.removePeer.match(action) && e2eeService.enabled) {
				e2eeService.removePeer(action.payload.id);
				dispatch(e2eeActions.removePeer({ peerId: action.payload.id }));
				pendingKeys.delete(action.payload.id);

				if (e2eeActive()) {
					void (async () => {
						await e2eeService.rotateLocalKey();

						for (const msg of await e2eeService.wrapLocalKeyForAll()) {
							signalingService.notify('e2eeKey', {
								toPeerId: msg.toPeerId, keyId: msg.keyId, iv: toB64(msg.iv), data: toB64(msg.data),
							});
						}
					})();
				}
			}

			return next(action);
		};
};

export default createE2eeMiddleware;
