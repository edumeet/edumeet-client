import { beforeEach, describe, expect, it, vi } from 'vitest';

const config = vi.hoisted(() => ({ obfuscateDisplayName: false }));

vi.mock('./edumeetConfig', () => ({ default: config }));

import { maskDisplayName, obfuscateDisplayNameForMonitoring } from './displayName';

describe('monitoring attachments', () => {
	beforeEach(() => {
		config.obfuscateDisplayName = false;
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
});
