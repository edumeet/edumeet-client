import { beforeEach, describe, expect, it, vi } from 'vitest';

const config = vi.hoisted(() => ({ obfuscateDisplayName: false, obfuscateRoomName: false }));

vi.mock('./edumeetConfig', () => ({ default: config }));

import { maskDisplayName, obfuscateDisplayNameForMonitoring, roomIdForMonitoring } from './displayName';

describe('monitoring attachments', () => {
	beforeEach(() => {
		config.obfuscateDisplayName = false;
		config.obfuscateRoomName = false;
	});

	it('masks every word but its first letter, and leaves a masked name alone', () => {
		expect(maskDisplayName('Jane Doe')).toBe('J••• D••');
		expect(maskDisplayName('J••• D••')).toBe('J••• D••');
		expect(maskDisplayName('A')).toBe('A');
		expect(maskDisplayName(undefined)).toBeUndefined();
	});

	it('passes the display name through unless the flag is set', () => {
		expect(obfuscateDisplayNameForMonitoring('Jane Doe')).toBe('Jane Doe');

		config.obfuscateDisplayName = true;

		expect(obfuscateDisplayNameForMonitoring('Jane Doe')).toBe('J••• D••');
	});

	it('names the room by its session id only when the flag is set', () => {
		expect(roomIdForMonitoring('team-sync', 'a1b2')).toBe('team-sync');
		expect(roomIdForMonitoring(undefined, 'a1b2')).toBeUndefined();

		config.obfuscateRoomName = true;

		expect(roomIdForMonitoring('team-sync', 'a1b2')).toBe('a1b2');
		expect(roomIdForMonitoring(undefined, 'a1b2')).toBe('a1b2');
	});
});
