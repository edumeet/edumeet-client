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

import createE2eeMiddleware from './e2eeMiddleware';
import { signalingActions } from '../slices/signalingSlice';
import { roomActions } from '../slices/roomSlice';
import { peersActions } from '../slices/peersSlice';
import { e2eeActions } from '../slices/e2eeSlice';
import { notificationsActions } from '../slices/notificationsSlice';
import { toB64 } from '../../utils/e2ee/crypto';

type SignalingNotification = { method: string; data: Record<string, unknown> };
// eslint-disable-next-line no-unused-vars
type NotificationHandler = (notification: SignalingNotification) => Promise<void> | void;
// eslint-disable-next-line no-unused-vars
type PeerCallback = (peerId: string) => void;
type MiddlewareInput = Parameters<typeof createE2eeMiddleware>[0];
type ApiInput = Parameters<ReturnType<typeof createE2eeMiddleware>>[0];

const PUB = toB64(new Uint8Array(65));

const makeSignaling = () => {
	let handler: NotificationHandler | undefined;

	return {
		notify: vi.fn(),
		on: vi.fn((event: string, cb: NotificationHandler) => {
			if (event === 'notification') handler = cb;
		}),
		deliver: (method: string, data: Record<string, unknown>) => handler?.({ method, data }),
	};
};

const keyMessage = (toPeerId: string) => ({ toPeerId, keyId: 7, iv: new Uint8Array(12), data: new Uint8Array(48).buffer });

const makeService = (enabled: boolean) => {
	const peers = new Set<string>();
	const nextStatus = new Map<string, 'new' | 'same' | 'changed'>();

	return {
		enabled,
		peers,
		nextStatus,
		hasPeer: (id: string) => peers.has(id),
		addPeer: vi.fn(async (id: string) => {
			const status = nextStatus.get(id) ?? (peers.has(id) ? 'same' : 'new');

			peers.add(id);

			return status;
		}),
		removePeer: vi.fn((id: string) => { peers.delete(id); }),
		getIdentityPublicKey: vi.fn(async () => new Uint8Array([ 4, 1, 2, 3 ])),
		wrapLocalKeyFor: vi.fn(async (id: string) => keyMessage(id)),
		wrapLocalKeyForAll: vi.fn(async () => [ ...peers ].map(keyMessage)),
		rotateLocalKey: vi.fn(async () => undefined),
		ratchetLocalKey: vi.fn(async () => undefined),
		onRemoteKey: vi.fn(async () => undefined),
		enable: vi.fn(async () => undefined),
		markKeyBurned: vi.fn(),
		onRotateRequired: undefined as (() => Promise<void>) | undefined,
		onKeyNeeded: undefined as PeerCallback | undefined,
		onEncryptionVerified: undefined as (() => void) | undefined,
		onEncryptionUnverified: undefined as (() => void) | undefined,
	};
};

const setup = ({ e2eeEnabled = true, serviceEnabled = true, producers = true } = {}) => {
	const signaling = makeSignaling();
	const service = makeService(serviceEnabled);
	const mediaService = { mediaSenders: { mic: producers ? { producer: {} } : {}, webcam: {} } };
	const dispatch = vi.fn();
	const next = vi.fn((action: unknown) => action);
	const getState = () => ({
		room: { e2eeEnabled },
		me: { id: 'me' },
		peers: { bob: { displayName: 'Bob' } },
	});
	const run = createE2eeMiddleware({ signalingService: signaling, e2eeService: service, mediaService } as unknown as MiddlewareInput)(
		{ dispatch, getState } as unknown as ApiInput
	)(next);

	run({ type: signalingActions.connect.type });

	return { signaling, service, dispatch, run };
};

const keysSentTo = (signaling: ReturnType<typeof makeSignaling>): string[] =>
	signaling.notify.mock.calls
		.filter(([ method ]) => method === 'e2eeKey')
		.map(([ , data ]) => (data as { toPeerId: string }).toPeerId);

const identity = (peerId: string) => ({ peerId, identityPubKey: PUB });

describe('E2EE middleware', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('does nothing in a room without end to end encryption', async () => {
		const { signaling, service } = setup({ e2eeEnabled: false });

		await signaling.deliver('e2eeIdentity', identity('bob'));
		await vi.advanceTimersByTimeAsync(500);

		expect(service.addPeer).not.toHaveBeenCalled();
		expect(signaling.notify).not.toHaveBeenCalled();
	});

	it('answers a first contact with its identity and, after the batch window, an advanced key', async () => {
		const { signaling, service } = setup();

		await signaling.deliver('e2eeIdentity', identity('bob'));

		expect(signaling.notify).toHaveBeenCalledWith('e2eeIdentity', expect.objectContaining({ toPeerId: 'bob' }));
		expect(service.ratchetLocalKey).not.toHaveBeenCalled();
		expect(keysSentTo(signaling)).toEqual([]);

		await vi.advanceTimersByTimeAsync(200);

		expect(service.ratchetLocalKey).toHaveBeenCalledTimes(1);
		expect(keysSentTo(signaling)).toEqual([ 'bob' ]);
	});

	it('covers peers arriving together with a single advance', async () => {
		const { signaling, service } = setup();

		await signaling.deliver('e2eeIdentity', identity('bob'));
		await signaling.deliver('e2eeIdentity', identity('carol'));
		await signaling.deliver('e2eeIdentity', identity('dave'));
		await vi.advanceTimersByTimeAsync(200);

		expect(service.ratchetLocalKey).toHaveBeenCalledTimes(1);
		expect(keysSentTo(signaling).sort()).toEqual([ 'bob', 'carol', 'dave' ]);
	});

	it('treats a repeat announcement from a known peer as a key request and throttles it', async () => {
		const { signaling, service } = setup();

		await signaling.deliver('e2eeIdentity', identity('bob'));
		await vi.advanceTimersByTimeAsync(200);
		signaling.notify.mockClear();
		service.ratchetLocalKey.mockClear();

		await signaling.deliver('e2eeIdentity', identity('bob'));

		expect(keysSentTo(signaling)).toEqual([ 'bob' ]);
		expect(service.ratchetLocalKey).not.toHaveBeenCalled();

		await signaling.deliver('e2eeIdentity', identity('bob'));

		expect(keysSentTo(signaling)).toEqual([ 'bob' ]);

		await vi.advanceTimersByTimeAsync(2000);
		await signaling.deliver('e2eeIdentity', identity('bob'));

		expect(keysSentTo(signaling)).toEqual([ 'bob', 'bob' ]);
	});

	it('warns about a changed identity and does not hand it a key', async () => {
		const { signaling, service, dispatch } = setup();

		await signaling.deliver('e2eeIdentity', identity('bob'));
		await vi.advanceTimersByTimeAsync(200);
		signaling.notify.mockClear();
		service.nextStatus.set('bob', 'changed');

		await signaling.deliver('e2eeIdentity', identity('bob'));

		expect(dispatch).toHaveBeenCalledWith(e2eeActions.setPeerIdentityChanged({ peerId: 'bob' }));
		expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: notificationsActions.enqueueNotification.type }));
		expect(keysSentTo(signaling)).toEqual([]);
	});

	it('holds a key that arrives before the identity and applies it once the KEK exists', async () => {
		const { signaling, service, dispatch } = setup();
		const key = { fromPeerId: 'bob', keyId: 7, iv: toB64(new Uint8Array(12)), data: toB64(new Uint8Array(48)) };

		await signaling.deliver('e2eeKey', key);

		expect(service.onRemoteKey).not.toHaveBeenCalled();

		await signaling.deliver('e2eeIdentity', identity('bob'));

		expect(service.onRemoteKey).toHaveBeenCalledWith('bob', 7, expect.any(Uint8Array), expect.any(ArrayBuffer));
		expect(dispatch).toHaveBeenCalledWith(e2eeActions.setPeerSecured({ peerId: 'bob' }));
	});

	it('applies a key from a known peer immediately', async () => {
		const { signaling, service, dispatch } = setup();

		await signaling.deliver('e2eeIdentity', identity('bob'));
		await signaling.deliver('e2eeKey', { fromPeerId: 'bob', keyId: 7, iv: toB64(new Uint8Array(12)), data: toB64(new Uint8Array(48)) });

		expect(service.onRemoteKey).toHaveBeenCalledTimes(1);
		expect(dispatch).toHaveBeenCalledWith(e2eeActions.setPeerSecured({ peerId: 'bob' }));
	});

	it('replaces its key and redistributes it when a peer leaves', async () => {
		const { signaling, service, dispatch, run } = setup();

		await signaling.deliver('e2eeIdentity', identity('bob'));
		await signaling.deliver('e2eeIdentity', identity('carol'));
		await vi.advanceTimersByTimeAsync(200);
		signaling.notify.mockClear();

		run(peersActions.removePeer({ id: 'bob' }));
		await vi.advanceTimersByTimeAsync(0);

		expect(service.rotateLocalKey).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(200);

		expect(service.removePeer).toHaveBeenCalledWith('bob');
		expect(dispatch).toHaveBeenCalledWith(e2eeActions.removePeer({ peerId: 'bob' }));
		expect(service.rotateLocalKey).toHaveBeenCalledTimes(1);
		expect(service.ratchetLocalKey).toHaveBeenCalledTimes(1);
		expect(keysSentTo(signaling)).toEqual([ 'carol' ]);
	});

	it('asks a peer for its key by announcing to that peer alone', async () => {
		const { signaling, service } = setup();

		expect(service.onKeyNeeded).toBeDefined();
		service.onKeyNeeded!('bob');
		await vi.advanceTimersByTimeAsync(0);

		expect(signaling.notify).toHaveBeenCalledWith('e2eeIdentity', expect.objectContaining({ toPeerId: 'bob' }));
		expect(keysSentTo(signaling)).toEqual([]);
	});

	it('enables the service and announces to the whole room once joined', async () => {
		const { signaling, service, run } = setup();

		run(roomActions.setState('joined'));
		await vi.advanceTimersByTimeAsync(0);

		expect(service.enable).toHaveBeenCalledWith('me');

		const [ method, data ] = signaling.notify.mock.calls[0];

		expect(method).toBe('e2eeIdentity');
		expect(data).not.toHaveProperty('toPeerId');
	});

	it('ignores a departure while the service is off', async () => {
		const { service, run } = setup({ serviceEnabled: false });

		run(peersActions.removePeer({ id: 'bob' }));
		await vi.advanceTimersByTimeAsync(0);

		expect(service.removePeer).not.toHaveBeenCalled();
		expect(service.rotateLocalKey).not.toHaveBeenCalled();
	});

	it('sends nothing to a peer that left inside the batch window', async () => {
		const { signaling, service, run } = setup();

		await signaling.deliver('e2eeIdentity', identity('bob'));
		run(peersActions.removePeer({ id: 'bob' }));
		await vi.advanceTimersByTimeAsync(200);

		expect(service.rotateLocalKey).toHaveBeenCalledTimes(1);
		expect(service.ratchetLocalKey).toHaveBeenCalledTimes(1);
		expect(keysSentTo(signaling)).toEqual([]);
	});

	it('answers a broadcast from a peer reconnecting briefly with a key and nothing else', async () => {
		const { signaling, service } = setup();

		await signaling.deliver('e2eeIdentity', identity('bob'));
		await signaling.deliver('e2eeIdentity', identity('carol'));
		await vi.advanceTimersByTimeAsync(200);
		signaling.notify.mockClear();
		service.ratchetLocalKey.mockClear();

		await signaling.deliver('e2eeIdentity', identity('bob'));
		await vi.advanceTimersByTimeAsync(200);

		const announcements = signaling.notify.mock.calls
			.filter(([ method ]) => method === 'e2eeIdentity');

		expect(keysSentTo(signaling)).toEqual([ 'bob' ]);
		expect(service.ratchetLocalKey).not.toHaveBeenCalled();
		expect(announcements).toHaveLength(0);
	});

	it('treats a peer returning after a long disconnect as a first contact', async () => {
		const { signaling, service, run } = setup();

		await signaling.deliver('e2eeIdentity', identity('bob'));
		await vi.advanceTimersByTimeAsync(200);
		run(peersActions.removePeer({ id: 'bob' }));
		await vi.advanceTimersByTimeAsync(200);
		signaling.notify.mockClear();
		service.ratchetLocalKey.mockClear();

		await signaling.deliver('e2eeIdentity', identity('bob'));

		expect(signaling.notify).toHaveBeenCalledWith('e2eeIdentity', expect.objectContaining({ toPeerId: 'bob' }));

		await vi.advanceTimersByTimeAsync(200);

		expect(service.ratchetLocalKey).toHaveBeenCalledTimes(1);
		expect(keysSentTo(signaling)).toEqual([ 'bob' ]);
	});

	it('never hands a newcomer the key from before the advance, even when their reply lands inside the batch window', async () => {
		const { signaling, service } = setup();

		await signaling.deliver('e2eeIdentity', identity('bob'));
		await vi.advanceTimersByTimeAsync(150);
		await signaling.deliver('e2eeIdentity', identity('bob'));

		expect(keysSentTo(signaling)).toEqual([]);
		expect(service.ratchetLocalKey).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(50);

		expect(service.ratchetLocalKey).toHaveBeenCalledTimes(1);
		expect(keysSentTo(signaling)).toEqual([ 'bob' ]);

		await signaling.deliver('e2eeIdentity', identity('bob'));

		expect(keysSentTo(signaling)).toEqual([ 'bob', 'bob' ]);
	});

	it('replaces its key once for several peers leaving inside the batch window', async () => {
		const { signaling, service, run } = setup();

		for (const id of [ 'bob', 'carol', 'dave' ]) await signaling.deliver('e2eeIdentity', identity(id));
		await vi.advanceTimersByTimeAsync(200);
		signaling.notify.mockClear();

		run(peersActions.removePeer({ id: 'bob' }));
		await vi.advanceTimersByTimeAsync(100);
		run(peersActions.removePeer({ id: 'carol' }));
		await vi.advanceTimersByTimeAsync(100);

		expect(service.rotateLocalKey).toHaveBeenCalledTimes(1);
		expect(keysSentTo(signaling)).toEqual([ 'dave' ]);

		await vi.advanceTimersByTimeAsync(500);

		expect(service.rotateLocalKey).toHaveBeenCalledTimes(1);
	});

	it('only marks the key burned while it has no producer, and replaces it when one starts', async () => {
		const { signaling, service, run } = setup({ producers: false });

		await signaling.deliver('e2eeIdentity', identity('bob'));
		await signaling.deliver('e2eeIdentity', identity('carol'));
		await vi.advanceTimersByTimeAsync(200);
		signaling.notify.mockClear();

		run(peersActions.removePeer({ id: 'bob' }));
		await vi.advanceTimersByTimeAsync(500);

		expect(service.markKeyBurned).toHaveBeenCalledTimes(1);
		expect(service.rotateLocalKey).not.toHaveBeenCalled();
		expect(keysSentTo(signaling)).toEqual([]);

		await service.onRotateRequired!();

		expect(service.rotateLocalKey).toHaveBeenCalledTimes(1);
		expect(keysSentTo(signaling)).toEqual([ 'carol' ]);
	});
});
