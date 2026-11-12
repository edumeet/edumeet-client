import type { TBBox, TSimplePathData } from 'fabric';

const overlaps = (coords: number[], box: TBBox, margin: number): boolean => {
	const xs = coords.filter((_, i) => i % 2 === 0);
	const ys = coords.filter((_, i) => i % 2 === 1);

	return Math.max(...xs) >= box.left - margin &&
		Math.min(...xs) <= box.left + box.width + margin &&
		Math.max(...ys) >= box.top - margin &&
		Math.min(...ys) <= box.top + box.height + margin;
};

export const pathNearBox = (path: TSimplePathData, box: TBBox, margin: number): TSimplePathData => {
	if (path.some(([ type ]) => type === 'Z')) return path;

	const near: TSimplePathData = [];
	let end = [ 0, 0 ];
	let joined = false;

	for (const command of path) {
		const [ type, ...coords ] = command;
		const start = end;

		end = coords.slice(-2);

		if (type === 'M' || !overlaps([ ...start, ...coords ], box, margin)) {
			joined = false;
			continue;
		}

		if (!joined) near.push([ 'M', start[0], start[1] ]);

		near.push(command);
		joined = true;
	}

	return near;
};
