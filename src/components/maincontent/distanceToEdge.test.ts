import { describe, expect, it } from 'vitest';
import { distanceToEdge } from './distanceToEdge';

const container = { left: 100, right: 1100, top: 50, bottom: 650 };
// An 8 px wide vertical handle with its middle at x = 400, and an 8 px high
// horizontal one with its middle at y = 250.
const vertical = { left: 396, right: 404, top: 50, bottom: 650 };
const horizontal = { left: 100, right: 1100, top: 246, bottom: 254 };

describe('distanceToEdge', () => {
	it('measures to the left and right edges from the middle of the handle', () => {
		expect(distanceToEdge(container, vertical, 'left')).toBe(300);
		expect(distanceToEdge(container, vertical, 'right')).toBe(700);
	});

	it('measures to the top and bottom edges from the middle of the handle', () => {
		expect(distanceToEdge(container, horizontal, 'top')).toBe(200);
		expect(distanceToEdge(container, horizontal, 'bottom')).toBe(400);
	});

	it('gives the two sides of a handle that add up to the container', () => {
		const width = container.right - container.left;

		expect(distanceToEdge(container, vertical, 'left') + distanceToEdge(container, vertical, 'right')).toBe(width);
	});
});
