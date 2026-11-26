import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async (config?: object) => {
	vi.stubGlobal('window', { config });
	vi.resetModules();

	return (await import('./edumeetConfig')).default;
};

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('theme.appBarLogo', () => {
	it('is the light eduMEET logo on the default dark app bar', async () => {
		const config = await load();

		expect(config.theme.appBarLogo).toBe('images/logo.edumeet.light.svg');
		expect(config.theme.logo).toBe('images/logo.edumeet.svg');
	});

	it('is the logo of a deployment that sets its own logo', async () => {
		const config = await load({ theme: { logo: 'images/our.svg' } });

		expect(config.theme.appBarLogo).toBe('images/our.svg');
	});

	it('is the logo when a deployment sets its own app bar colour', async () => {
		const config = await load({ theme: { appBarColor: 'rgba(255, 255, 255, 1.0)' } });

		expect(config.theme.appBarLogo).toBe('images/logo.edumeet.svg');
	});

	it('is appBarLogo when a deployment sets it', async () => {
		const config = await load({ theme: { logo: 'images/our.svg', appBarLogo: 'images/our-light.svg' } });

		expect(config.theme.appBarLogo).toBe('images/our-light.svg');
	});
});
