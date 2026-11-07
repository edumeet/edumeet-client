import { describe, expect, it } from 'vitest';
import { chooseHorizontal, layoutScore, tileArea } from './videoLayout';

const ASPECT = 16 / 9;

describe('tileArea', () => {
	it('fits one tile by the limiting side', () => {
		// 16:9 tile in a wide box is limited by the height (minus the gap).
		expect(tileArea(1, 1000, 108, ASPECT)).toBeCloseTo(100 * ASPECT * 100);
	});

	it('is 0 without tiles or space', () => {
		expect(tileArea(0, 1000, 1000, ASPECT)).toBe(0);
		expect(tileArea(3, 0, 1000, ASPECT)).toBe(0);
		expect(tileArea(3, 1000, -5, ASPECT)).toBe(0);
	});
});

describe('chooseHorizontal', () => {
	it('puts a screen share next to two cameras in a slightly narrower than 16:9 area', () => {
		// The reported case: wide screen with the side panel open. The old rule
		// (width / height > 16 / 9) stacked them.
		const input = { width: 2140, height: 1230, spotlights: 1, videos: 2, aspectRatio: ASPECT };

		expect(input.width / input.height).toBeLessThan(ASPECT);
		expect(chooseHorizontal(input)).toBe(true);
	});

	it('stacks them in a narrow, tall area', () => {
		expect(chooseHorizontal({ width: 700, height: 1050, spotlights: 1, videos: 4, aspectRatio: ASPECT })).toBe(false);
	});

	it('keeps the old rule with only one kind of video', () => {
		expect(chooseHorizontal({ width: 1000, height: 1000, spotlights: 0, videos: 5, aspectRatio: ASPECT })).toBe(false);
		expect(chooseHorizontal({ width: 2000, height: 1000, spotlights: 2, videos: 0, aspectRatio: ASPECT })).toBe(true);
	});

	it('does not flip near the break-even point', () => {
		// Find a width where both layouts score about the same.
		const base = { height: 900, spotlights: 1, videos: 3, aspectRatio: ASPECT };
		let width = 600;

		while (layoutScore({ ...base, width }, true) < layoutScore({ ...base, width }, false)) width += 10;

		const input = { ...base, width };

		expect(chooseHorizontal({ ...input, horizontal: true })).toBe(true);
		expect(chooseHorizontal({ ...input, horizontal: false })).toBe(false);
	});
});
