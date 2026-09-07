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
import { MlsKeyProvider, PendingCommit } from '../../utils/e2ee/MlsKeyProvider';
import { Logger } from '../../utils/Logger';

const logger = new Logger('MlsMiddleware');

const MAX_REFUSALS = 20;
const JOIN_TIMEOUT_MS = 60000;
const LEAVE_BATCH_MS = 200;
const COMMITTER_FALLBACK_MS = 3000;
const FALLBACK_STAGGER_MS = 200;
const FALLBACK_STAGGER_CAP = 20;
const EPOCH_CHECK_THROTTLE_MS = 2000;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Group key agreement over the room server's MLS delivery service. The server orders commits and
// hands newcomers the current GroupInfo; every member derives the frame keys of every sender from
// the epoch secret, so no key is ever sent. Selected by the client configuration; the pairwise
// middleware stays idle while this one runs, and the other way round.
const createMlsMiddleware = ({ signalingService, e2eeService, config }: MiddlewareOptions): Middleware => {
	logger.debug('createMlsMiddleware()');

	const selected = config.e2eeProvider === 'mls';
	const departed = new Set<string>();
	let departureTimer: ReturnType<typeof setTimeout> | undefined;
	let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
	let joining: Promise<void> | undefined;
	let resyncing: Promise<void> | undefined;
	let handlersWired = false;
	let inbox: Promise<void> = Promise.resolve();
	let listening = false;
	let lastEpochCheck = 0;
	let stateOf: (() => RootState) | undefined;
	const secured = new Set<string>();

	const mls = (): MlsKeyProvider | undefined => e2eeService.mls;

	const fail = (dispatch: AppDispatch, reason: string, error?: unknown): void => {
		logger.error('%s, leaving the room rather than sending unencrypted media [error:%o]', reason, error);

		try {
			sessionStorage.setItem(JOIN_ERROR_KEY, roomE2eeFailedLabel());
		} catch { /* sessionStorage may be unavailable (private mode), still leave */ }

		dispatch(notificationsActions.enqueueNotification({
			message: roomE2eeFailedLabel(),
			options: { variant: 'error', persist: true }
		}));
		dispatch(roomActions.setState('left'));
	};

	const synced = async (dispatch: AppDispatch, myPeerId: string): Promise<void> => {
		await e2eeService.applyEpochKeys();

		const provider = mls();

		if (!provider) return;

		const members = provider.members();

		for (const member of members) {
			if (member.peerId === myPeerId || secured.has(member.peerId)) continue;

			secured.add(member.peerId);
			dispatch(e2eeActions.setPeerSecured({ peerId: member.peerId }));
		}

		for (const peerId of [ ...departed ]) {
			if (!members.some((m) => m.peerId === peerId)) departed.delete(peerId);
		}

		if (departed.size > 0) scheduleDeparture(dispatch, myPeerId);
	};

	// One round trip that can fail while the socket is reconnecting. That is a reason to ask again,
	// not to leave the room, so the loops below treat a failed request like a request to wait.
	const askToJoin = async (): Promise<{ role: string; epoch?: number; groupInfo?: string; retryAfterMs?: number } | undefined> => {
		try {
			return await signalingService.sendRequest('mlsJoin');
		} catch (error) {
			logger.warn('join request failed, asking again [error:%o]', error);

			return undefined;
		}
	};

	// Offers a commit to the server. Only an accepted commit changes our state; a refused one means
	// another commit won the epoch and will reach us as a notification. A request that fails outright
	// is treated as refused: if the server did accept it, the next commit will not apply to the state
	// we kept and the resync that follows repairs it.
	const offer = async (provider: MlsKeyProvider, pending: PendingCommit): Promise<boolean> => {
		let result: { accepted?: boolean; epoch?: number } | undefined;

		try {
			result = await signalingService.sendRequest('mlsCommit', {
				epoch: pending.epoch, commit: pending.commit, groupInfo: pending.groupInfo,
			});
		} catch (error) {
			logger.warn('commit request failed [error:%o]', error);

			return false;
		}

		if (result?.accepted) {
			provider.accept(pending);

			return true;
		}

		logger.debug('commit refused by the server, another commit won the epoch [ours:%d, current:%s]', pending.epoch, String(result?.epoch));

		return false;
	};

	const join = async (dispatch: AppDispatch, getState: () => RootState, myPeerId: string): Promise<void> => {
		const provider = await e2eeService.enableMls(myPeerId);

		provider.onIdentityChanged = (peerId: string) => {
			dispatch(e2eeActions.setPeerIdentityChanged({ peerId }));
			dispatch(notificationsActions.enqueueNotification({
				message: peerIdentityChangedLabel(getState().peers[peerId]?.displayName || peerId),
				options: { variant: 'warning', persist: true }
			}));
		};

		signalingService.notify('mlsKeyPackage', { keyPackage: provider.keyPackage() });

		// Waiting is bounded by time, because the server admits joiners one at a time and frees a
		// silent one only after its own timeout; refused commits are bounded by count, because each
		// one means a race with a member's commit was lost.
		const deadline = Date.now() + JOIN_TIMEOUT_MS;
		const joinedAtStart = provider.joined;

		for (let refusals = 0; refusals < MAX_REFUSALS && Date.now() < deadline;) {
			// A member may add us with a Welcome while we wait for our turn; then there is nothing to ask.
			if (!joinedAtStart && provider.joined) {
				logger.debug('joined from a Welcome while waiting');

				return;
			}

			const info = await askToJoin();

			if (!info || info.role === 'wait') {
				await sleep(info?.retryAfterMs ?? 500);
				continue;
			}

			refusals++;

			if (info.role === 'founder') {
				const groupInfo = await provider.found(crypto.randomUUID());
				let published: { accepted?: boolean } | undefined;

				try {
					published = await signalingService.sendRequest('mlsGroupInfo', { epoch: 0, groupInfo });
				} catch (error) {
					logger.warn('publishing the group failed, asking again [error:%o]', error);
				}

				if (!published?.accepted) {
					logger.debug('the group was not published, asking again');
					provider.reset();
					continue;
				}

				logger.debug('founded the group');
				await synced(dispatch, myPeerId);

				return;
			}

			if (info.role !== 'joiner' || !info.groupInfo) throw new Error(`unexpected join answer ${JSON.stringify(info)}`);

			const pending = await provider.joinExternal(info.groupInfo);

			if (!joinedAtStart && provider.joined) {
				logger.debug('joined from a Welcome while preparing a commit, discarding it');

				return;
			}

			if (await offer(provider, pending)) {
				logger.debug('joined the group externally [epoch:%d]', provider.epoch);
				await synced(dispatch, myPeerId);

				return;
			}
		}

		throw new Error('could not join the group in time');
	};

	// The worker cannot decrypt someone, which in a quiet room is the only sign that a commit was
	// missed. The server's epoch says whether that is so; if not, the keys are simply pushed again.
	// Commits still queued or being applied are let through first: a slow tab is behind the server
	// for the seconds a commit takes it, and that is not a reason to rejoin.
	const checkEpoch = async (dispatch: AppDispatch, myPeerId: string): Promise<void> => {
		const now = Date.now();

		if (now - lastEpochCheck < EPOCH_CHECK_THROTTLE_MS) return;

		lastEpochCheck = now;

		await inbox;

		const provider = mls();

		if (!provider?.joined || joining || resyncing) return;

		const info = await signalingService.sendRequest('mlsEpoch');

		if (Number.isInteger(info?.epoch) && info.epoch > provider.epoch) {
			logger.warn('behind the group, resyncing [ours:%d, current:%d]', provider.epoch, info.epoch);
			await resync(dispatch, myPeerId);

			return;
		}

		await e2eeService.applyEpochKeys();
	};

	// We fell out of step with the group, most likely a commit we could not apply. Rejoining from the
	// current GroupInfo replaces our old leaf and brings us to the current epoch.
	const resync = (dispatch: AppDispatch, myPeerId: string): Promise<void> => {
		if (!resyncing) {
			resyncing = (async () => {
				const provider = mls();

				if (!provider) return;

				const deadline = Date.now() + JOIN_TIMEOUT_MS;

				for (let refusals = 0; refusals < MAX_REFUSALS && Date.now() < deadline;) {
					const info = await askToJoin();

					if (!info || info.role !== 'joiner' || !info.groupInfo) {
						await sleep(info?.retryAfterMs ?? 500);
						continue;
					}

					if (await offer(provider, await provider.joinExternal(info.groupInfo))) {
						logger.debug('resynced with the group [epoch:%d]', provider.epoch);
						await synced(dispatch, myPeerId);

						return;
					}

					refusals++;
				}

				throw new Error('could not resync with the group in time');
			})().catch((error) => fail(dispatch, 'resync with the group failed', error))
				.finally(() => { resyncing = undefined; });
		}

		return resyncing;
	};

	// A peer that is back in the room, under the same id, is not departed whatever the set says: the
	// room can collapse and re-form around a member whose earlier disappearance is still remembered,
	// and removing it then would throw a present member out of the group.
	const commitDepartures = async (dispatch: AppDispatch, myPeerId: string): Promise<void> => {
		const provider = mls();

		if (!provider?.joined || departed.size === 0) return;

		const present = stateOf?.().peers ?? {};

		for (const peerId of [ ...departed ]) {
			if (present[peerId]) departed.delete(peerId);
		}

		if (departed.size === 0) return;

		const pending = await provider.commitRemove([ ...departed ]);

		if (!pending) {
			departed.clear();

			return;
		}

		if (await offer(provider, pending)) {
			logger.debug('committed the departure of %d peer(s) [epoch:%d]', departed.size, provider.epoch);
			await synced(dispatch, myPeerId);
		}
	};

	// Departures are batched, then committed by the member with the lowest leaf index still present.
	// Everyone else waits for that commit and steps in only if it does not come, the next lowest
	// first, so that a slow committer costs one extra commit rather than one from every member.
	function scheduleDeparture(dispatch: AppDispatch, myPeerId: string): void {
		if (departureTimer) return;

		departureTimer = setTimeout(() => {
			departureTimer = undefined;

			void (async () => {
				const provider = mls();

				if (!provider?.joined) return;

				try {
					const rank = provider.committerRank(departed);

					if (rank === 0) {
						await commitDepartures(dispatch, myPeerId);
					} else if (rank > 0 && !fallbackTimer) {
						fallbackTimer = setTimeout(() => {
							fallbackTimer = undefined;
							commitDepartures(dispatch, myPeerId).catch((error) => logger.error('fallback departure commit failed [error:%o]', error));
						}, COMMITTER_FALLBACK_MS + (Math.min(rank, FALLBACK_STAGGER_CAP) * FALLBACK_STAGGER_MS));
					}
				} catch (error) {
					logger.error('committing departures failed [error:%o]', error);
				}
			})();
		}, LEAVE_BATCH_MS);
	}

	const wireHandlers = (dispatch: AppDispatch, getState: () => RootState): void => {
		if (handlersWired) return;
		handlersWired = true;

		e2eeService.onKeyNeeded = () => {
			void checkEpoch(dispatch, getState().me.id).catch((error) => logger.error('checking the epoch failed [error:%o]', error));
		};

		e2eeService.onLeafLost = () => {
			logger.warn('our leaf is gone from the group, resyncing');
			void resync(dispatch, getState().me.id);
		};

		e2eeService.onEncryptionVerified = () => {
			logger.debug('E2EE verified, media is genuinely being encrypted');
			dispatch(e2eeActions.setEncryptionVerified(true));
		};

		e2eeService.onEncryptionUnverified = () => fail(dispatch, 'E2EE could not be verified');
	};

	return ({ dispatch, getState }: { dispatch: AppDispatch; getState: () => RootState }) =>
		(next) => (action) => {
			if (!selected) return next(action);

			stateOf = getState;
			wireHandlers(dispatch, getState);

			const active = (): boolean => Boolean(getState().room.e2eeEnabled) && isInsertableStreamsSupported();

			// Notifications are handled one at a time. Two commits in a row must be judged against the
			// epoch the first one produces, not the one both were received at.
			if (signalingActions.connect.match(action) && !listening) {
				listening = true;
				signalingService.on('notification', (notification) => {
					inbox = inbox.then(async () => {
						if (!active() || !e2eeService.enabled) return;

						const myPeerId = getState().me.id;

						switch (notification.method) {
							case 'mlsCommit': {
								const { fromPeerId, epoch, commit } = notification.data;

								if (joining) await joining;
								if (resyncing) await resyncing;

								const current = mls();

								if (!current?.joined) return;

								// The server numbers epochs as the group does, so the relayed number says
								// whether this commit is old news, the next step, or proof that one was missed.
								const target = Number(epoch);

								if (Number.isInteger(target) && target <= current.epoch) {
									logger.debug('commit already covered [from:%s, epoch:%d, ours:%d]', fromPeerId, target, current.epoch);

									return;
								}

								if (Number.isInteger(target) && target > current.epoch + 1) {
									logger.warn('missed a commit, resyncing [from:%s, epoch:%d, ours:%d]', fromPeerId, target, current.epoch);
									await resync(dispatch, myPeerId);

									return;
								}

								try {
									await current.applyCommit(commit);
								} catch (error) {
									logger.warn('could not apply a commit, resyncing [from:%s, epoch:%s, error:%o]', fromPeerId, String(epoch), error);
									await resync(dispatch, myPeerId);

									return;
								}

								await synced(dispatch, myPeerId);

								break;
							}

							case 'mlsWelcome': {
								const { welcome } = notification.data;
								const provider = mls();

								if (!provider || provider.joined) return;

								await provider.applyWelcome(welcome);
								await synced(dispatch, myPeerId);

								break;
							}

							case 'mlsProposal': {
								logger.debug('proposal received and ignored, this client commits its own [from:%s]', notification.data?.fromPeerId);

								break;
							}
						}
					}).catch((error) => {
						logger.error('mls notification error [error:%o]', error);
					});
				});
			}

			if (roomActions.setState.match(action) && action.payload === 'joined' && active() && !joining) {
				const myPeerId = getState().me.id;

				joining = join(dispatch, getState, myPeerId)
					.catch((error) => fail(dispatch, 'joining the MLS group failed', error))
					.finally(() => { joining = undefined; });
			}

			if (roomActions.setState.match(action) && action.payload === 'left') {
				if (departureTimer) clearTimeout(departureTimer);
				if (fallbackTimer) clearTimeout(fallbackTimer);

				departureTimer = undefined;
				fallbackTimer = undefined;
				departed.clear();
				secured.clear();
			}

			if (peersActions.addPeer.match(action)) departed.delete(action.payload.id);
			if (peersActions.addPeers.match(action)) for (const peer of action.payload) departed.delete(peer.id);

			if (peersActions.removePeer.match(action) && e2eeService.enabled) {
				e2eeService.removePeer(action.payload.id);
				secured.delete(action.payload.id);
				dispatch(e2eeActions.removePeer({ peerId: action.payload.id }));

				if (active()) {
					departed.add(action.payload.id);
					scheduleDeparture(dispatch, getState().me.id);
				}
			}

			return next(action);
		};
};

export default createMlsMiddleware;
