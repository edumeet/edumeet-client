import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, browserWarnings: [] } }));
vi.mock('../store', () => ({ fileService: {} }));

import { leaveOnPageHide } from './roomActions';

describe('a page that goes away', () => {
	it('closes the connection to the room server, as the leave button does, without other changes', () => {
		const dispatch = vi.fn();
		const signalingService = { disconnect: vi.fn() };

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(leaveOnPageHide() as any)(dispatch, () => ({}), { signalingService });

		expect(signalingService.disconnect).toHaveBeenCalledTimes(1);
		expect(dispatch).not.toHaveBeenCalled();
	});
});
