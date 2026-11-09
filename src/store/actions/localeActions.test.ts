import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {} } }));
vi.mock('../store', () => ({}));
vi.mock('../../utils/rtl', () => ({ loadRtlSupport: vi.fn() }));

import { setLocale } from './localeActions';
import { loadRtlSupport } from '../../utils/rtl';
import { roomActions } from '../slices/roomSlice';
import { settingsActions } from '../slices/settingsSlice';

const run = async (locale?: string, stored?: string) => {
	const dispatch = vi.fn();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await (setLocale(locale) as any)(dispatch, () => ({ settings: { locale: stored } }), {});

	return dispatch;
};

beforeEach(() => {
	vi.stubGlobal('document', { documentElement: { lang: '' } });
	vi.mocked(loadRtlSupport).mockReset();
	vi.mocked(loadRtlSupport).mockResolvedValue(undefined);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('setLocale', () => {
	it('loads right-to-left support for Persian and turns it on', async () => {
		const dispatch = await run('fa');

		expect(loadRtlSupport).toHaveBeenCalledOnce();
		expect(dispatch).toHaveBeenCalledWith(settingsActions.setLocale('fa'));
		expect(dispatch).toHaveBeenCalledWith(roomActions.updateRoom({ localeInProgress: false, rtl: true }));
		expect(document.documentElement.lang).toBe('fa');
	});

	it('stays left to right for other languages, also from a regional browser tag', async () => {
		const dispatch = await run('de-at');

		expect(loadRtlSupport).not.toHaveBeenCalled();
		expect(dispatch).toHaveBeenCalledWith(settingsActions.setLocale('de'));
		expect(dispatch).toHaveBeenCalledWith(roomActions.updateRoom({ localeInProgress: false, rtl: false }));
		expect(document.documentElement.lang).toBe('de');
	});

	it('falls back to left to right when the support fails to load, and frees the language selector', async () => {
		vi.mocked(loadRtlSupport).mockRejectedValueOnce(new Error('offline'));

		const dispatch = await run('fa');

		expect(dispatch).toHaveBeenCalledWith(settingsActions.setLocale('fa'));
		expect(dispatch).toHaveBeenCalledWith(roomActions.updateRoom({ localeInProgress: false, rtl: false }));
	});

	it('uses the stored language when none is given, and English for one that no longer exists', async () => {
		expect(await run(undefined, 'fa')).toHaveBeenCalledWith(settingsActions.setLocale('fa'));
		expect(await run(undefined, 'dk')).toHaveBeenCalledWith(settingsActions.setLocale('en'));
	});
});
