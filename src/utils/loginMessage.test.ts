import { describe, expect, test, vi, afterEach } from 'vitest';
import { acceptLoginMessage, expectLoginFrom, loginAbandoned } from './loginMessage';

const MGMT = 'https://mgmt.example.org';
const tab = {} as Window;
const other = {} as Window;
const message = (source: Window | null, data: unknown = { type: 'edumeet-login', data: 'token-1', idToken: 'id-1' }, origin = MGMT) =>
	({ data, origin, source } as MessageEvent);

afterEach(() => {
	vi.useRealTimers();
	loginAbandoned(tab);
});

describe('a login message', () => {
	test('is taken from the tab login() opened, once', () => {
		expectLoginFrom(tab);

		expect(acceptLoginMessage(message(tab), MGMT)).toEqual({ token: 'token-1', idToken: 'id-1' });
		expect(acceptLoginMessage(message(tab), MGMT)).toBeUndefined();
	});

	test('is ignored when this page started no sign-in (login CSRF)', () => {
		expect(acceptLoginMessage(message(tab), MGMT)).toBeUndefined();
	});

	test('is ignored from any other window, also with the right origin', () => {
		expectLoginFrom(tab);

		expect(acceptLoginMessage(message(other), MGMT)).toBeUndefined();
		expect(acceptLoginMessage(message(null), MGMT)).toBeUndefined();
		// The pending sign-in still works.
		expect(acceptLoginMessage(message(tab), MGMT)?.token).toBe('token-1');
	});

	test('is ignored from another origin or with a token that is not a string', () => {
		expectLoginFrom(tab);

		expect(acceptLoginMessage(message(tab, undefined, 'https://evil.example'), MGMT)).toBeUndefined();
		expect(acceptLoginMessage(message(tab, { type: 'edumeet-login', data: { token: 'x' } }), MGMT)).toBeUndefined();
		expect(acceptLoginMessage(message(tab, { type: 'edumeet-login', data: 't', idToken: 5 }), MGMT)).toBeUndefined();
		expect(acceptLoginMessage(message(tab, { type: 'other', data: 't' }), MGMT)).toBeUndefined();
		expect(acceptLoginMessage(message(tab), undefined)).toBeUndefined();
	});

	test('is ignored once the sign-in was abandoned or has expired', () => {
		expectLoginFrom(tab);
		loginAbandoned(tab);
		expect(acceptLoginMessage(message(tab), MGMT)).toBeUndefined();

		vi.useFakeTimers();
		expectLoginFrom(tab);
		vi.advanceTimersByTime(16 * 60 * 1000);
		expect(acceptLoginMessage(message(tab), MGMT)).toBeUndefined();
	});
});
