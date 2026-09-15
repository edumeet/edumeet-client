import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {} } }));
vi.mock('../store', () => ({}));
vi.mock('./managementActions', () => ({ getTenantFromFqdn: () => 'getTenantFromFqdn' }));
vi.mock('../../components/translated/translatedComponents', () => ({
	invalidLoginLabel: () => 'invalid login',
	loginTabBlockedLabel: () => 'login tab blocked',
	noTenantFoundLabel: () => 'no tenant',
	sessionEndedLabel: () => 'session ended'
}));

import { login, refreshToken, updateLoginState, REFRESH_RETRY_DELAYS_MS } from './permissionsActions';

type Action = { type?: string; payload?: unknown };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const actionsOf = (dispatch: any): Action[] => dispatch.mock.calls
	.map(([ action ]: [ unknown ]) => action)
	.filter((action: unknown) => typeof action === 'object' && action !== null) as Action[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notifications = (dispatch: any) => actionsOf(dispatch)
	.filter((action) => action.type === 'notifications/enqueueNotification')
	.map((action) => (action.payload as { message?: string })?.message);

describe('login', () => {
	const config = { managementUrl: 'https://admin.example.eu' };
	let loginTab: { location: { href: string }; close: ReturnType<typeof vi.fn> };
	let open: ReturnType<typeof vi.fn>;
	let order: string[];

	beforeEach(() => {
		order = [];
		loginTab = { location: { href: 'about:blank' }, close: vi.fn() };
		open = vi.fn(() => {
			order.push('open');

			return loginTab;
		});
		vi.stubGlobal('window', {
			open,
			location: { hostname: 'rooms.acme.edu', origin: 'https://rooms.acme.edu' }
		});
	});
	afterEach(() => vi.unstubAllGlobals());

	const run = (tenantId: unknown) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dispatch: any = vi.fn((action: unknown) => {
			if (action === 'getTenantFromFqdn') {
				order.push('lookup');

				return Promise.resolve(tenantId);
			}

			return action;
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return { dispatch, done: (login() as any)(dispatch, () => ({}), { config }) };
	};

	it('opens the tab before looking up the tenant, then sends it to the login with the page origin', async () => {
		const { dispatch, done } = run(5);

		expect(open).toHaveBeenCalledWith('about:blank', 'loginWindow');
		await done;

		expect(order).toEqual([ 'open', 'lookup' ]);

		const url = new URL(loginTab.location.href);

		expect(url.origin + url.pathname).toBe('https://admin.example.eu/oauth/tenant');
		expect(url.searchParams.get('tenantId')).toBe('5');
		expect(url.searchParams.get('origin')).toBe('https://rooms.acme.edu');
		expect(loginTab.close).not.toHaveBeenCalled();
		expect(notifications(dispatch)).toEqual([]);
	});

	it('tells the user when the browser blocks the tab, without looking up the tenant', async () => {
		open.mockReturnValue(null);

		const { dispatch, done } = run(5);

		await done;

		expect(notifications(dispatch)).toEqual([ 'login tab blocked' ]);
		expect(dispatch).not.toHaveBeenCalledWith('getTenantFromFqdn');
	});

	it('closes the tab again when no tenant is found', async () => {
		const { dispatch, done } = run(undefined);

		await done;

		expect(loginTab.close).toHaveBeenCalledTimes(1);
		expect(loginTab.location.href).toBe('about:blank');
		expect(notifications(dispatch)).toEqual([ 'no tenant' ]);
	});
});

const SIGNALING_URL = 'wss://rooms.acme.edu:443/?peerId=p&roomId=r&token=old-token';

interface World {
	state: {
		permissions: { token?: string };
		room: { state: string };
		signaling: { url?: string; state: string };
	};
	sendRequest: ReturnType<typeof vi.fn>;
	create: ReturnType<typeof vi.fn>;
	management: {
		service: () => { create: ReturnType<typeof vi.fn> };
		authentication: { setAccessToken: ReturnType<typeof vi.fn>; removeAccessToken: ReturnType<typeof vi.fn> };
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	dispatch: any;
	// eslint-disable-next-line no-unused-vars
	run: (thunk: unknown) => Promise<void>;
}

// A small store: thunks run, and permission and signaling actions update the state the thunks read.
const makeWorld = (roomState = 'new'): World => {
	const create = vi.fn();
	const world = {
		state: {
			permissions: { token: 'old-token' },
			room: { state: roomState },
			signaling: {
				url: roomState === 'new' ? undefined : SIGNALING_URL,
				state: roomState === 'new' ? 'new' : 'connected'
			}
		},
		sendRequest: vi.fn().mockResolvedValue(undefined),
		create,
		management: {
			service: () => ({ create }),
			authentication: { setAccessToken: vi.fn(), removeAccessToken: vi.fn() }
		}
	} as unknown as World;

	const extra = () => ({
		managementService: Promise.resolve(world.management),
		signalingService: { sendRequest: world.sendRequest }
	});

	world.dispatch = vi.fn((action: unknown) => {
		if (typeof action === 'function') return action(world.dispatch, () => world.state, extra());

		const { type, payload } = action as Action;

		if (type === 'permissions/setToken') world.state.permissions.token = payload as string | undefined;
		if (type === 'signaling/setUrl') world.state.signaling.url = payload as string;

		return action;
	});
	// eslint-disable-next-line no-unused-vars
	world.run = (thunk: unknown) => (thunk as (...args: unknown[]) => Promise<void>)(world.dispatch, () => world.state, extra());

	return world;
};

const flush = () => vi.advanceTimersByTimeAsync(0);

describe('refreshToken', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	for (const code of [ 401, 403 ]) {
		it(`signs the user out with a notice when the server refuses with ${code}`, async () => {
			const world = makeWorld();

			world.create.mockRejectedValue({ code });
			await world.run(refreshToken());
			await flush();

			expect(world.management.authentication.removeAccessToken).toHaveBeenCalledTimes(1);
			expect(world.state.permissions.token).toBeUndefined();
			expect(notifications(world.dispatch)).toEqual([ 'session ended' ]);

			await vi.runAllTimersAsync();
			expect(world.create).toHaveBeenCalledTimes(1);
		});
	}

	for (const roomState of [ 'joined', 'lobby' ]) {
		it(`keeps the room identity when refused while ${roomState}, and still signs out of management`, async () => {
			const world = makeWorld(roomState);

			world.create.mockRejectedValue({ code: 403 });
			await world.run(refreshToken());
			await flush();

			expect(world.management.authentication.removeAccessToken).toHaveBeenCalledTimes(1);
			expect(world.state.permissions.token).toBeUndefined();
			expect(actionsOf(world.dispatch).some((a) => a.type === 'permissions/setLoggedIn' && a.payload === false)).toBe(true);
			expect(notifications(world.dispatch)).toEqual([ 'session ended' ]);
			expect(world.sendRequest).not.toHaveBeenCalled();
			expect(world.state.signaling.url).toBe(SIGNALING_URL);
		});
	}

	it('still hands a refreshed token to the room server during a call', async () => {
		const world = makeWorld('joined');
		const newToken = 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig';

		world.create.mockResolvedValue({ accessToken: newToken });
		await world.run(refreshToken());
		await flush();

		expect(world.sendRequest).toHaveBeenCalledWith('updateToken', { token: newToken });
		expect(new URL(world.state.signaling.url ?? '').searchParams.get('token')).toBe(newToken);
	});

	it('ignores a refusal that arrives after the user signed in again', async () => {
		const world = makeWorld('joined');

		world.create.mockImplementation(async () => {
			world.state.permissions.token = 'fresh-token';
			throw Object.assign(new Error('Not authenticated'), { code: 401 });
		});
		await world.run(refreshToken());
		await flush();

		expect(world.management.authentication.removeAccessToken).not.toHaveBeenCalled();
		expect(world.state.permissions.token).toBe('fresh-token');
		expect(notifications(world.dispatch)).toEqual([]);
	});

	it('ignores a refreshed token that arrives after the user signed out', async () => {
		const world = makeWorld();

		world.create.mockImplementation(async () => {
			world.state.permissions.token = undefined;

			return { accessToken: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig' };
		});
		await world.run(refreshToken());
		await flush();

		expect(world.management.authentication.setAccessToken).not.toHaveBeenCalled();
		expect(world.state.permissions.token).toBeUndefined();
	});

	it('retries a network failure and recovers', async () => {
		const world = makeWorld();
		const newToken = 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig';

		world.create
			.mockRejectedValueOnce(new TypeError('Failed to fetch'))
			.mockRejectedValueOnce({ code: 503 })
			.mockResolvedValue({ accessToken: newToken });

		await world.run(refreshToken());
		expect(world.create).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(REFRESH_RETRY_DELAYS_MS[0]);
		expect(world.create).toHaveBeenCalledTimes(2);

		await vi.advanceTimersByTimeAsync(REFRESH_RETRY_DELAYS_MS[1]);
		expect(world.create).toHaveBeenCalledTimes(3);

		expect(world.management.authentication.setAccessToken).toHaveBeenCalledWith(newToken);
		expect(world.management.authentication.removeAccessToken).not.toHaveBeenCalled();
		expect(world.state.permissions.token).toBe(newToken);
	});

	it('gives up quietly after the last retry without signing the user out', async () => {
		const world = makeWorld();

		world.create.mockRejectedValue(new TypeError('Failed to fetch'));
		await world.run(refreshToken(REFRESH_RETRY_DELAYS_MS.length));
		await vi.runAllTimersAsync();

		expect(world.create).toHaveBeenCalledTimes(1);
		expect(world.management.authentication.removeAccessToken).not.toHaveBeenCalled();
		expect(world.state.permissions.token).toBe('old-token');
	});

	it('keeps every retry inside the five minutes before the token expires', () => {
		expect(REFRESH_RETRY_DELAYS_MS.reduce((sum, delay) => sum + delay, 0)).toBeLessThan(5 * 60 * 1000);
	});
});

describe('updateLoginState', () => {
	it('signs out of the room as well by default', async () => {
		const world = makeWorld('joined');

		await world.run(updateLoginState());

		expect(world.state.permissions.token).toBeUndefined();
		expect(world.sendRequest).toHaveBeenCalledWith('updateToken', { token: undefined });
		expect(new URL(world.state.signaling.url ?? '').searchParams.get('token')).toBeNull();
	});

	it('leaves the room untouched when asked to keep the room identity', async () => {
		const world = makeWorld('joined');

		await world.run(updateLoginState(undefined, { keepRoomIdentity: true }));

		expect(world.state.permissions.token).toBeUndefined();
		expect(world.sendRequest).not.toHaveBeenCalled();
		expect(world.state.signaling.url).toBe(SIGNALING_URL);
	});
});
