import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, simulcast: true, simulcastSharing: true } }));
vi.mock('../../services/mediaService', () => ({}));
vi.mock('../store', () => ({}));
vi.mock('../selectors', () => ({ isInsertableStreamsSupported: () => true }));
vi.mock('./roomMiddleware', () => ({ JOIN_ERROR_KEY: 'joinError' }));
vi.mock('../../components/translated/translatedComponents', () => ({
	peerIdentityChangedLabel: (peer: string) => `identity changed ${peer}`,
	roomE2eeFailedLabel: () => 'e2ee failed',
	peerSentReactionLabel: () => 'reaction',
}));

import createMlsMiddleware from './mlsMiddleware';
import { signalingActions } from '../slices/signalingSlice';
import { roomActions } from '../slices/roomSlice';
import { peersActions } from '../slices/peersSlice';
import { e2eeActions } from '../slices/e2eeSlice';
import { notificationsActions } from '../slices/notificationsSlice';

type SignalingNotification = { method: string; data: Record<string, unknown> };
// eslint-disable-next-line no-unused-vars
type NotificationHandler = (notification: SignalingNotification) => Promise<void> | void;
type MiddlewareInput = Parameters<typeof createMlsMiddleware>[0];
type ApiInput = Parameters<ReturnType<typeof createMlsMiddleware>>[0];
type Member = { peerId: string; leafIndex: number };

const flush = async (): Promise<void> => {
	for (let i = 0; i < 20; i++) await Promise.resolve();
};

const makeSignaling = () => {
	let handler: NotificationHandler | undefined;
	const answers: unknown[] = [];

	return {
		answers,
		notify: vi.fn(),
		sendRequest: vi.fn(async (method: string, data?: unknown) => {
			void method;
			void data;

			return answers.shift();
		}),
		on: vi.fn((event: string, cb: NotificationHandler) => {
			if (event === 'notification') handler = cb;
		}),
		deliver: async (method: string, data: Record<string, unknown>) => {
			handler?.({ method, data });
			await flush();
		},
	};
};

// A stand-in for MlsKeyProvider: membership is a plain list, commits are opaque strings.
const makeProvider = (myPeerId: string) => {
	let members: Member[] = [];
	let joined = false;
	let epoch = -1;
	let seq = 0;
	const pending = (label: string, nextMembers: Member[]) => ({
		epoch, commit: `${label}-${++seq}`, groupInfo: `gi-${label}-${seq}`, state: { members: nextMembers },
	});

	return {
		peerId: myPeerId,
		// eslint-disable-next-line no-unused-vars
		onIdentityChanged: undefined as ((peerId: string) => void) | undefined,
		get joined() { return joined; },
		get epoch() { return epoch; },
		get myLeafIndex() { return members.find((m) => m.peerId === myPeerId)?.leafIndex ?? -1; },
		members: () => members,
		keyPackage: () => 'kp-me',
		reset: vi.fn(() => {
			members = [];
			joined = false;
			epoch = -1;
		}),
		found: vi.fn(async () => {
			members = [ { peerId: myPeerId, leafIndex: 0 } ];
			joined = true;
			epoch = 0;

			return 'gi-founded';
		}),
		joinExternal: vi.fn(async (groupInfo: string) => {
			const others = groupInfo.startsWith('gi-two') ? [ { peerId: 'alice', leafIndex: 0 }, { peerId: 'bob', leafIndex: 1 } ] : [ { peerId: 'alice', leafIndex: 0 } ];
			const target = Number(groupInfo.match(/@(\d+)$/)?.[1] ?? epoch);

			return { ...pending('join', [ ...others, { peerId: myPeerId, leafIndex: others.length } ]), epoch: target, target };
		}),
		applyCommit: vi.fn(async (commit: string) => {
			if (commit === 'stale') throw new Error('Cannot process commit or proposal from former epoch');
			if (commit.startsWith('remove:')) members = members.filter((m) => !commit.includes(m.peerId));

			epoch++;
		}),
		applyWelcome: vi.fn(async () => {
			members = [ { peerId: 'alice', leafIndex: 0 }, { peerId: myPeerId, leafIndex: 1 } ];
			joined = true;
			epoch = 1;
		}),
		commitRemove: vi.fn(async (peerIds: string[]) => {
			const gone = members.filter((m) => peerIds.includes(m.peerId));

			if (gone.length === 0) return undefined;

			return pending(`remove:${gone.map((m) => m.peerId).join(',')}`, members.filter((m) => !peerIds.includes(m.peerId)));
		}),
		commitUpdate: vi.fn(async () => pending('update', members)),
		accept: vi.fn((p: { state: { members: Member[] }; target?: number }) => {
			members = p.state.members;
			joined = true;
			epoch = p.target !== undefined ? p.target + 1 : epoch + 1;
		}),
		committerRank: vi.fn((departed: Set<string>) => {
			const remaining = members.filter((m) => !departed.has(m.peerId)).map((m) => m.leafIndex)
				.sort((a, b) => a - b);

			return remaining.indexOf(members.find((m) => m.peerId === myPeerId)?.leafIndex ?? -1);
		}),
		setMembers: (m: Member[]) => { members = m; joined = true; epoch = Math.max(epoch, 1); },
		advance: () => { epoch++; },
	};
};

const setup = ({ e2eeEnabled = true, e2eeProvider = 'mls' } = {}) => {
	const signaling = makeSignaling();
	const provider = makeProvider('me');
	const service = {
		enabled: true,
		mls: undefined as ReturnType<typeof makeProvider> | undefined,
		enableMls: vi.fn(async () => {
			service.mls = provider;

			return provider;
		}),
		applyEpochKeys: vi.fn(async () => undefined),
		removePeer: vi.fn(),
		onKeyNeeded: undefined as (() => void) | undefined,
		onLeafLost: undefined as (() => void) | undefined,
		onEncryptionVerified: undefined as (() => void) | undefined,
		onEncryptionUnverified: undefined as (() => void) | undefined,
	};
	const dispatch = vi.fn();
	const next = vi.fn((action: unknown) => action);
	const getState = () => ({ room: { e2eeEnabled }, me: { id: 'me' }, peers: {} });
	const run = createMlsMiddleware({ signalingService: signaling, e2eeService: service, config: { e2eeProvider } } as unknown as MiddlewareInput)(
		{ dispatch, getState } as unknown as ApiInput
	)(next);

	run({ type: signalingActions.connect.type });

	const join = async (): Promise<void> => {
		run(roomActions.setState('joined'));
		await flush();
	};

	return { signaling, service, provider, dispatch, run, join };
};

const requested = (signaling: ReturnType<typeof makeSignaling>): string[] => signaling.sendRequest.mock.calls.map(([ method ]) => method as string);

describe('MLS middleware', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it('stays idle when the client is configured for the pairwise provider', async () => {
		const { service, signaling, join } = setup({ e2eeProvider: 'pairwise' });

		await join();

		expect(service.enableMls).not.toHaveBeenCalled();
		expect(signaling.sendRequest).not.toHaveBeenCalled();
	});

	it('founds the group when it is first, publishes the GroupInfo and applies the epoch keys', async () => {
		const { signaling, service, provider, join } = setup();

		signaling.answers.push({ role: 'founder' }, { accepted: true, epoch: 0 });
		await join();

		expect(signaling.notify).toHaveBeenCalledWith('mlsKeyPackage', { keyPackage: 'kp-me' });
		expect(requested(signaling)).toEqual([ 'mlsJoin', 'mlsGroupInfo' ]);
		expect(signaling.sendRequest).toHaveBeenLastCalledWith('mlsGroupInfo', { epoch: 0, groupInfo: 'gi-founded' });
		expect(provider.found).toHaveBeenCalled();
		expect(service.applyEpochKeys).toHaveBeenCalledTimes(1);
	});

	it('joins externally from the GroupInfo it is handed and marks the members secured', async () => {
		const { signaling, service, provider, dispatch, join } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 3, groupInfo: 'gi-two' }, { accepted: true, epoch: 4 });
		await join();

		expect(requested(signaling)).toEqual([ 'mlsJoin', 'mlsCommit' ]);
		expect(signaling.sendRequest).toHaveBeenLastCalledWith('mlsCommit', expect.objectContaining({ commit: 'join-1', groupInfo: 'gi-join-1' }));
		expect(provider.accept).toHaveBeenCalledTimes(1);
		expect(service.applyEpochKeys).toHaveBeenCalledTimes(1);
		expect(dispatch).toHaveBeenCalledWith(e2eeActions.setPeerSecured({ peerId: 'alice' }));
		expect(dispatch).toHaveBeenCalledWith(e2eeActions.setPeerSecured({ peerId: 'bob' }));
		expect(dispatch).not.toHaveBeenCalledWith(e2eeActions.setPeerSecured({ peerId: 'me' }));
	});

	it('waits while a founder is publishing, and asks again with fresh GroupInfo when its commit loses', async () => {
		const { signaling, provider, join } = setup();

		signaling.answers.push(
			{ role: 'wait', retryAfterMs: 10 },
			{ role: 'joiner', epoch: 0, groupInfo: 'gi-one' }, { accepted: false, epoch: 1 },
			{ role: 'joiner', epoch: 1, groupInfo: 'gi-two' }, { accepted: true, epoch: 2 },
		);

		const joined = join();

		await vi.advanceTimersByTimeAsync(20);
		await joined;

		expect(requested(signaling)).toEqual([ 'mlsJoin', 'mlsJoin', 'mlsCommit', 'mlsJoin', 'mlsCommit' ]);
		expect(provider.joinExternal).toHaveBeenCalledTimes(2);
		expect(provider.accept).toHaveBeenCalledTimes(1);
		expect(provider.members().map((m) => m.peerId)).toEqual([ 'alice', 'bob', 'me' ]);
	});

	it('applies the next commit, ignores one already covered, and resyncs on a gap or a commit it cannot apply', async () => {
		const { signaling, service, provider, join } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-one@0' }, { accepted: true, epoch: 1 });
		await join();
		service.applyEpochKeys.mockClear();
		expect(provider.epoch).toBe(1);

		await signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 1, commit: 'old-news' });

		expect(provider.applyCommit).not.toHaveBeenCalled();

		await signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 2, commit: 'update-9' });

		expect(provider.applyCommit).toHaveBeenCalledWith('update-9');
		expect(provider.epoch).toBe(2);
		expect(service.applyEpochKeys).toHaveBeenCalledTimes(1);

		signaling.answers.push({ role: 'joiner', epoch: 5, groupInfo: 'gi-two@5' }, { accepted: true, epoch: 6 });
		await signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 4, commit: 'after-a-gap' });
		await flush();

		expect(provider.applyCommit).toHaveBeenCalledTimes(1);
		expect(requested(signaling).slice(-2)).toEqual([ 'mlsJoin', 'mlsCommit' ]);
		expect(provider.joinExternal).toHaveBeenLastCalledWith('gi-two@5');
		expect(provider.epoch).toBe(6);
		expect(service.applyEpochKeys).toHaveBeenCalledTimes(2);

		signaling.answers.push({ role: 'joiner', epoch: 8, groupInfo: 'gi-two@8' }, { accepted: true, epoch: 9 });
		await signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 7, commit: 'stale' });
		await flush();

		expect(provider.epoch).toBe(9);
		expect(service.applyEpochKeys).toHaveBeenCalledTimes(3);
	});

	it('commits departures in one batch when it holds the lowest leaf, and drops the leavers keys at once', async () => {
		const { signaling, service, provider, run } = setup();

		signaling.answers.push({ role: 'founder' }, { accepted: true, epoch: 0 });
		run(roomActions.setState('joined'));
		await flush();
		provider.setMembers([ { peerId: 'me', leafIndex: 0 }, { peerId: 'bob', leafIndex: 1 }, { peerId: 'carol', leafIndex: 2 } ]);
		signaling.sendRequest.mockClear();
		signaling.answers.push({ accepted: true, epoch: 2 });

		run(peersActions.removePeer({ id: 'bob' }));
		run(peersActions.removePeer({ id: 'carol' }));

		expect(service.removePeer).toHaveBeenCalledWith('bob');
		expect(service.removePeer).toHaveBeenCalledWith('carol');

		await vi.advanceTimersByTimeAsync(250);

		expect(provider.commitRemove).toHaveBeenCalledTimes(1);
		expect(provider.commitRemove).toHaveBeenCalledWith(expect.arrayContaining([ 'bob', 'carol' ]));
		expect(requested(signaling)).toEqual([ 'mlsCommit' ]);
		expect(provider.members().map((m) => m.peerId)).toEqual([ 'me' ]);
	});

	it('leaves the departure to the lowest leaf and steps in only when that commit never comes', async () => {
		const { signaling, provider, run } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-two' }, { accepted: true, epoch: 1 });
		run(roomActions.setState('joined'));
		await flush();
		provider.setMembers([ { peerId: 'alice', leafIndex: 0 }, { peerId: 'bob', leafIndex: 1 }, { peerId: 'me', leafIndex: 2 } ]);
		signaling.sendRequest.mockClear();

		run(peersActions.removePeer({ id: 'bob' }));
		await vi.advanceTimersByTimeAsync(250);

		expect(provider.commitRemove).not.toHaveBeenCalled();

		await signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 2, commit: 'remove:bob' });
		await vi.advanceTimersByTimeAsync(5000);

		expect(provider.commitRemove).not.toHaveBeenCalled();

		provider.setMembers([ { peerId: 'alice', leafIndex: 0 }, { peerId: 'carol', leafIndex: 1 }, { peerId: 'me', leafIndex: 2 } ]);
		signaling.answers.push({ accepted: true, epoch: 4 });
		run(peersActions.removePeer({ id: 'carol' }));
		await vi.advanceTimersByTimeAsync(250);

		expect(provider.commitRemove).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(3300);

		expect(provider.commitRemove).toHaveBeenCalledWith([ 'carol' ]);
		expect(requested(signaling)).toEqual([ 'mlsCommit' ]);
	});

	it('does nothing in a room without end to end encryption', async () => {
		const { service, signaling, join, run } = setup({ e2eeEnabled: false });

		await join();
		run(peersActions.removePeer({ id: 'bob' }));
		await vi.advanceTimersByTimeAsync(5000);

		expect(service.enableMls).not.toHaveBeenCalled();
		expect(signaling.sendRequest).not.toHaveBeenCalled();
	});

	it('forgets a founded group when the server refused its publication and joins instead', async () => {
		const { signaling, provider, join } = setup();

		signaling.answers.push({ role: 'founder' }, { accepted: false, epoch: 0 }, { role: 'joiner', epoch: 0, groupInfo: 'gi-one@0' }, { accepted: true, epoch: 1 });
		await join();

		expect(provider.reset).toHaveBeenCalledTimes(1);
		expect(requested(signaling)).toEqual([ 'mlsJoin', 'mlsGroupInfo', 'mlsJoin', 'mlsCommit' ]);
		expect(provider.members().map((m) => m.peerId)).toEqual([ 'alice', 'me' ]);
	});

	it('runs one join at a time when the room reports joined twice', async () => {
		const { signaling, provider, run } = setup();

		signaling.answers.push({ role: 'founder' }, { accepted: true, epoch: 0 });
		run(roomActions.setState('joined'));
		run(roomActions.setState('joined'));
		await flush();

		expect(provider.found).toHaveBeenCalledTimes(1);
		expect(requested(signaling)).toEqual([ 'mlsJoin', 'mlsGroupInfo' ]);
	});

	it('re-arms a departure that a relayed commit did not cover', async () => {
		const { signaling, provider, run } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-two@0' }, { accepted: true, epoch: 1 });
		run(roomActions.setState('joined'));
		await flush();
		provider.setMembers([ { peerId: 'alice', leafIndex: 0 }, { peerId: 'bob', leafIndex: 1 }, { peerId: 'me', leafIndex: 2 }, { peerId: 'dave', leafIndex: 3 } ]);
		signaling.sendRequest.mockClear();

		run(peersActions.removePeer({ id: 'alice' }));
		run(peersActions.removePeer({ id: 'dave' }));
		await vi.advanceTimersByTimeAsync(250);

		expect(provider.commitRemove).not.toHaveBeenCalled();

		await signaling.deliver('mlsCommit', { fromPeerId: 'bob', epoch: 2, commit: 'remove:alice' });
		await vi.advanceTimersByTimeAsync(250);

		expect(provider.commitRemove).not.toHaveBeenCalled();

		signaling.answers.push({ accepted: true, epoch: 3 });
		await vi.advanceTimersByTimeAsync(3300);

		expect(provider.commitRemove).toHaveBeenCalledWith([ 'dave' ]);
		expect(requested(signaling)).toEqual([ 'mlsCommit' ]);
	});

	it('warns about a member whose signature key changed under a known peer id', async () => {
		const { signaling, provider, dispatch, join } = setup();

		signaling.answers.push({ role: 'founder' }, { accepted: true, epoch: 0 });
		await join();

		provider.onIdentityChanged?.('bob');

		expect(dispatch).toHaveBeenCalledWith(e2eeActions.setPeerIdentityChanged({ peerId: 'bob' }));
		expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'notifications/enqueueNotification' }));
	});

	it('applies two commits that arrive back to back in order, without a resync', async () => {
		const { signaling, service, provider, join } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-one@0' }, { accepted: true, epoch: 1 });
		await join();
		signaling.sendRequest.mockClear();
		service.applyEpochKeys.mockClear();

		const first = signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 2, commit: 'update-1' });
		const second = signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 3, commit: 'update-2' });

		await Promise.all([ first, second ]);

		expect(provider.applyCommit.mock.calls.map(([ c ]) => c)).toEqual([ 'update-1', 'update-2' ]);
		expect(provider.epoch).toBe(3);
		expect(signaling.sendRequest).not.toHaveBeenCalled();
		expect(service.applyEpochKeys).toHaveBeenCalledTimes(2);
	});

	it('keeps waiting for a founder past the attempt limit, since the server frees a silent one late', async () => {
		const { signaling, provider, join } = setup();

		for (let i = 0; i < 12; i++) signaling.answers.push({ role: 'wait', retryAfterMs: 10 });
		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-one@0' }, { accepted: true, epoch: 1 });

		const joined = join();

		await vi.advanceTimersByTimeAsync(200);
		await joined;

		expect(requested(signaling).filter((m) => m === 'mlsJoin').length).toBe(13);
		expect(provider.accept).toHaveBeenCalledTimes(1);
	});

	it('checks the server epoch when the worker cannot decrypt, resyncs when behind and re-pushes keys when not', async () => {
		const { signaling, service, provider, join } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-one@0' }, { accepted: true, epoch: 1 });
		await join();
		signaling.sendRequest.mockClear();
		service.applyEpochKeys.mockClear();

		signaling.answers.push({ epoch: 4 }, { role: 'joiner', epoch: 4, groupInfo: 'gi-two@4' }, { accepted: true, epoch: 5 });
		service.onKeyNeeded?.();
		await flush();

		expect(requested(signaling)).toEqual([ 'mlsEpoch', 'mlsJoin', 'mlsCommit' ]);
		expect(provider.joinExternal).toHaveBeenLastCalledWith('gi-two@4');
		expect(provider.epoch).toBe(5);

		service.onKeyNeeded?.();
		await flush();

		expect(requested(signaling).length).toBe(3);

		await vi.advanceTimersByTimeAsync(2100);
		signaling.answers.push({ epoch: 5 });
		service.onKeyNeeded?.();
		await flush();

		expect(requested(signaling)).toEqual([ 'mlsEpoch', 'mlsJoin', 'mlsCommit', 'mlsEpoch' ]);
		expect(provider.joinExternal).toHaveBeenCalledTimes(2);
		expect(service.applyEpochKeys).toHaveBeenCalledTimes(2);
	});

	it('resyncs when its own leaf has vanished from the group', async () => {
		const { signaling, service, provider, join } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-one@0' }, { accepted: true, epoch: 1 });
		await join();
		signaling.sendRequest.mockClear();

		signaling.answers.push({ role: 'joiner', epoch: 3, groupInfo: 'gi-two@3' }, { accepted: true, epoch: 4 });
		service.onLeafLost?.();
		await flush();

		expect(requested(signaling)).toEqual([ 'mlsJoin', 'mlsCommit' ]);
		expect(provider.epoch).toBe(4);
	});

	it('marks each member secured once, not once per commit', async () => {
		const { signaling, dispatch, join } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-two@0' }, { accepted: true, epoch: 1 });
		await join();
		await signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 2, commit: 'update-1' });
		await signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 3, commit: 'update-2' });

		const securedCalls = dispatch.mock.calls.filter(([ action ]) => action.type === e2eeActions.setPeerSecured.type);

		expect(securedCalls.map(([ action ]) => action.payload.peerId)).toEqual([ 'alice', 'bob' ]);
	});

	it('steps in later the further it is from the lowest leaf, so slow committers cost one commit, not one per member', async () => {
		const { signaling, provider, run } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-two@0' }, { accepted: true, epoch: 1 });
		run(roomActions.setState('joined'));
		await flush();
		provider.setMembers([ { peerId: 'alice', leafIndex: 0 }, { peerId: 'bob', leafIndex: 1 }, { peerId: 'carol', leafIndex: 2 }, { peerId: 'me', leafIndex: 3 } ]);
		signaling.sendRequest.mockClear();
		signaling.answers.push({ accepted: true, epoch: 2 });

		run(peersActions.removePeer({ id: 'alice' }));
		await vi.advanceTimersByTimeAsync(200 + 3000 + (2 * 200) - 50);

		expect(provider.commitRemove).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(100);

		expect(provider.commitRemove).toHaveBeenCalledWith([ 'alice' ]);
	});
	it('keeps a resync waiting through a long join queue instead of giving up', async () => {
		const { signaling, service, provider, join } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-one@0' }, { accepted: true, epoch: 1 });
		await join();
		signaling.sendRequest.mockClear();
		service.applyEpochKeys.mockClear();

		for (let i = 0; i < 12; i++) signaling.answers.push({ role: 'wait', retryAfterMs: 10 });
		signaling.answers.push({ role: 'joiner', epoch: 7, groupInfo: 'gi-two@7' }, { accepted: true, epoch: 8 });

		const delivered = signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 5, commit: 'after-a-gap' });

		await vi.advanceTimersByTimeAsync(300);
		await delivered;

		expect(requested(signaling).filter((m) => m === 'mlsJoin').length).toBe(13);
		expect(provider.epoch).toBe(8);
		expect(service.applyEpochKeys).toHaveBeenCalledTimes(1);
	});

	it('asks again after a failed join request rather than leaving the room', async () => {
		const { signaling, provider, dispatch, run } = setup();

		signaling.sendRequest.mockRejectedValueOnce(new Error('socket closed'));
		signaling.answers.push({ role: 'founder' }, { accepted: true, epoch: 0 });

		run(roomActions.setState('joined'));
		await flush();
		await vi.advanceTimersByTimeAsync(600);

		expect(provider.found).toHaveBeenCalledTimes(1);
		expect(dispatch).not.toHaveBeenCalledWith(roomActions.setState('left'));
	});

	it('treats a commit request that fails as refused and tries again', async () => {
		const { signaling, provider, join } = setup();

		signaling.sendRequest.mockImplementationOnce(async () => ({ role: 'joiner', epoch: 0, groupInfo: 'gi-one@0' }));
		signaling.sendRequest.mockRejectedValueOnce(new Error('socket closed'));
		signaling.answers.push({ role: 'joiner', epoch: 1, groupInfo: 'gi-one@1' }, { accepted: true, epoch: 2 });
		await join();

		expect(provider.joinExternal).toHaveBeenCalledTimes(2);
		expect(provider.accept).toHaveBeenCalledTimes(1);
		expect(provider.epoch).toBe(2);
	});
	it('joins from a Welcome that arrives while it is waiting, and stops asking', async () => {
		const { signaling, service, provider, run } = setup();

		signaling.answers.push({ role: 'wait', retryAfterMs: 10 });
		run(roomActions.setState('joined'));
		await flush();
		await signaling.deliver('mlsWelcome', { fromPeerId: 'alice', epoch: 1, welcome: 'w1' });

		expect(provider.applyWelcome).toHaveBeenCalledWith('w1');
		expect(service.applyEpochKeys).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(2000);

		expect(provider.joinExternal).not.toHaveBeenCalled();

		await signaling.deliver('mlsWelcome', { fromPeerId: 'alice', epoch: 2, welcome: 'w2' });

		expect(provider.applyWelcome).toHaveBeenCalledTimes(1);
	});

	it('ignores group messages while the room is not end to end encrypted', async () => {
		const { signaling, provider, service } = setup({ e2eeEnabled: false });

		await signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 2, commit: 'update-1' });
		await signaling.deliver('mlsProposal', { fromPeerId: 'alice', proposal: 'p' });

		expect(provider.applyCommit).not.toHaveBeenCalled();
		expect(service.applyEpochKeys).not.toHaveBeenCalled();
	});

	it('leaves the room and says why when the join cannot complete', async () => {
		const { signaling, dispatch, join } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 3 });
		await join();

		expect(dispatch).toHaveBeenCalledWith(roomActions.setState('left'));
		expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: notificationsActions.enqueueNotification.type }));
	});

	it('leaves the room when the join deadline passes with nobody answering', async () => {
		const { dispatch, run } = setup();

		run(roomActions.setState('joined'));
		await vi.advanceTimersByTimeAsync(61_000);

		expect(dispatch).toHaveBeenCalledWith(roomActions.setState('left'));
	});

	it('leaves the room when a resync is refused too many times', async () => {
		const { signaling, provider, dispatch, join } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-one@0' }, { accepted: true, epoch: 1 });
		await join();

		for (let i = 0; i < 20; i++) signaling.answers.push({ role: 'joiner', epoch: 9, groupInfo: 'gi-two@9' }, { accepted: false, epoch: 10 });
		await signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 9, commit: 'after-a-gap' });
		await vi.advanceTimersByTimeAsync(50);

		expect(provider.joinExternal).toHaveBeenCalledTimes(21);
		expect(provider.accept).toHaveBeenCalledTimes(1);
		expect(dispatch).toHaveBeenCalledWith(roomActions.setState('left'));
	});

	it('marks the room verified when a frame is encrypted, and leaves when the transform never proves it', async () => {
		const { service, dispatch, join, signaling } = setup();

		signaling.answers.push({ role: 'founder' }, { accepted: true, epoch: 0 });
		await join();

		service.onEncryptionVerified?.();

		expect(dispatch).toHaveBeenCalledWith(e2eeActions.setEncryptionVerified(true));

		service.onEncryptionUnverified?.();

		expect(dispatch).toHaveBeenCalledWith(roomActions.setState('left'));
	});

	it('applies a commit that arrives while the join is still in flight, once the join is done', async () => {
		const { signaling, provider, run } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-one@0' }, { accepted: true, epoch: 1 });
		run(roomActions.setState('joined'));
		await signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 2, commit: 'update-1' });
		await flush();

		expect(provider.applyCommit).toHaveBeenCalledWith('update-1');
		expect(provider.epoch).toBe(2);
	});

	it('drops a departure of a peer that was never in the group without committing', async () => {
		const { signaling, provider, run } = setup();

		signaling.answers.push({ role: 'founder' }, { accepted: true, epoch: 0 });
		run(roomActions.setState('joined'));
		await flush();
		signaling.sendRequest.mockClear();

		run(peersActions.removePeer({ id: 'ghost' }));
		await vi.advanceTimersByTimeAsync(5000);

		expect(provider.commitRemove).toHaveBeenCalledWith([ 'ghost' ]);
		expect(signaling.sendRequest).not.toHaveBeenCalled();
	});

	it('does not ask the server about the epoch before it has joined', async () => {
		const { signaling, service } = setup();

		service.onKeyNeeded?.();
		await flush();

		expect(signaling.sendRequest).not.toHaveBeenCalled();
	});

	it('cancels a pending departure commit when the room is left', async () => {
		const { signaling, provider, run } = setup();

		signaling.answers.push({ role: 'founder' }, { accepted: true, epoch: 0 });
		run(roomActions.setState('joined'));
		await flush();
		provider.setMembers([ { peerId: 'me', leafIndex: 0 }, { peerId: 'bob', leafIndex: 1 } ]);

		run(peersActions.removePeer({ id: 'bob' }));
		run(roomActions.setState('left'));
		await vi.advanceTimersByTimeAsync(5000);

		expect(provider.commitRemove).not.toHaveBeenCalled();
	});
	it('keeps the date of a pending fallback when more commits arrive, so a departure nobody commits is not postponed forever', async () => {
		const { signaling, provider, run } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-two@0' }, { accepted: true, epoch: 1 });
		run(roomActions.setState('joined'));
		await flush();
		provider.setMembers([ { peerId: 'alice', leafIndex: 0 }, { peerId: 'bob', leafIndex: 1 }, { peerId: 'me', leafIndex: 2 } ]);
		signaling.sendRequest.mockClear();

		run(peersActions.removePeer({ id: 'bob' }));
		await vi.advanceTimersByTimeAsync(250);

		for (let epoch = 2; epoch <= 4; epoch++) {
			await signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch, commit: `update-${epoch}` });
			await vi.advanceTimersByTimeAsync(1000);
		}

		expect(provider.commitRemove).not.toHaveBeenCalled();

		signaling.answers.push({ accepted: true, epoch: 6 });
		await vi.advanceTimersByTimeAsync(400);

		expect(provider.commitRemove).toHaveBeenCalledWith([ 'bob' ]);
	});
	it('forgets a founded group when publishing it fails, and joins once the request works again', async () => {
		const { signaling, provider, dispatch, join } = setup();

		signaling.sendRequest.mockImplementationOnce(async () => ({ role: 'founder' }));
		signaling.sendRequest.mockRejectedValueOnce(new Error('socket closed'));
		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-one@0' }, { accepted: true, epoch: 1 });
		await join();

		expect(provider.found).toHaveBeenCalledTimes(1);
		expect(provider.reset).toHaveBeenCalledTimes(1);
		expect(provider.epoch).toBe(1);
		expect(dispatch).not.toHaveBeenCalledWith(roomActions.setState('left'));
	});
	it('lets a commit that is still being applied finish before asking the server about the epoch', async () => {
		const { signaling, service, provider, join } = setup();

		signaling.answers.push({ role: 'joiner', epoch: 0, groupInfo: 'gi-one@0' }, { accepted: true, epoch: 1 });
		await join();
		signaling.sendRequest.mockClear();
		service.applyEpochKeys.mockClear();

		let finishApply: () => void = () => undefined;

		provider.applyCommit.mockImplementationOnce(() => new Promise<void>((resolve) => {
			finishApply = () => {
				provider.advance();
				resolve();
			};
		}));

		const delivered = signaling.deliver('mlsCommit', { fromPeerId: 'alice', epoch: 2, commit: 'slow-update' });

		await flush();
		service.onKeyNeeded?.();
		await flush();

		expect(signaling.sendRequest).not.toHaveBeenCalled();

		signaling.answers.push({ epoch: 2 });
		finishApply();
		await delivered;
		await flush();

		expect(requested(signaling)).toEqual([ 'mlsEpoch' ]);
		expect(provider.joinExternal).toHaveBeenCalledTimes(1);
		expect(service.applyEpochKeys).toHaveBeenCalledTimes(2);
	});
});
