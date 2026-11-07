import { describe, expect, it } from 'vitest';
import { chooseHorizontal, layoutScore, shrinkToFit, tileArea } from './videoLayout';

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

describe('shrinkToFit', () => {
	it('keeps the base sizes when they fit', () => {
		expect(shrinkToFit(1000, 600, 300)).toEqual([ 600, 300 ]);
	});

	it('shrinks both in proportion to their base size', () => {
		// 100% wide spotlights next to a 400px area in 1000px: 400px too much.
		const [ first, second ] = shrinkToFit(1000, 1000, 400);

		expect(first + second).toBeCloseTo(1000);
		expect(first).toBeCloseTo(1000 - (400 * 1000 / 1400));
		expect(second).toBeCloseTo(400 - (400 * 400 / 1400));
	});
});

describe('chooseHorizontal', () => {
	it('stacks a screen share above two cameras in a small square area', () => {
		// From the review: with the areas shrinking to fit, side by side leaves
		// the screen share about 350px wide; stacked gives it the full width.
		expect(chooseHorizontal({ width: 600, height: 600, spotlights: 1, videos: 2, aspectRatio: ASPECT })).toBe(false);
	});

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
