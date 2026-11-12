import { describe, expect, it } from 'vitest';
import type { TSimplePathData } from 'fabric';
import { pathNearBox } from './pathNearBox';

const box = { left: 0, top: 0, width: 10, height: 10 };

describe('pathNearBox', () => {
	it('keeps the whole path when all of it is near the box', () => {
		const path: TSimplePathData = [ [ 'M', 1, 1 ], [ 'Q', 5, 5, 9, 1 ], [ 'L', 9, 9 ] ];

		expect(pathNearBox(path, box, 0)).toEqual(path);
	});

	it('keeps only the segments near the box and starts them where the segment before ended', () => {
		const path: TSimplePathData = [ [ 'M', -40, 5 ], [ 'L', -20, 5 ], [ 'L', 5, 5 ], [ 'L', 30, 5 ], [ 'L', 60, 5 ] ];

		expect(pathNearBox(path, box, 0)).toEqual([ [ 'M', -20, 5 ], [ 'L', 5, 5 ], [ 'L', 30, 5 ] ]);
	});

	it('moves over a gap to where the path comes back near the box', () => {
		const path: TSimplePathData = [ [ 'M', 5, 5 ], [ 'L', 5, 20 ], [ 'L', 30, 20 ], [ 'L', 30, 8 ], [ 'L', 8, 8 ] ];

		expect(pathNearBox(path, box, 0)).toEqual([ [ 'M', 5, 5 ], [ 'L', 5, 20 ], [ 'M', 30, 8 ], [ 'L', 8, 8 ] ]);
	});

	it('keeps a curve whose end points are far but which bends into the box through its control point', () => {
		const quadratic: TSimplePathData = [ [ 'M', -50, -20 ], [ 'Q', 5, 30, 60, -20 ] ];
		const cubic: TSimplePathData = [ [ 'M', -50, -20 ], [ 'C', 0, 14, 10, 14, 60, -20 ] ];

		expect(pathNearBox(quadratic, box, 0)).toEqual(quadratic);
		expect(pathNearBox(cubic, box, 0)).toEqual(cubic);
	});

	it('keeps a segment within the margin around the box and drops one beyond it', () => {
		const path: TSimplePathData = [ [ 'M', 0, 13 ], [ 'L', 10, 13 ] ];

		expect(pathNearBox(path, box, 3)).toEqual(path);
		expect(pathNearBox(path, box, 2)).toEqual([]);
	});

	it('gives nothing when no part of the path comes near the box', () => {
		const path: TSimplePathData = [ [ 'M', 20, 20 ], [ 'Q', 30, 30, 40, 20 ], [ 'L', 50, 50 ] ];

		expect(pathNearBox(path, box, 2)).toEqual([]);
	});

	it('leaves a closed path as it is', () => {
		const path: TSimplePathData = [ [ 'M', 20, 20 ], [ 'L', 40, 20 ], [ 'L', 40, 40 ], [ 'Z' ] ];

		expect(pathNearBox(path, box, 0)).toBe(path);
	});
});
