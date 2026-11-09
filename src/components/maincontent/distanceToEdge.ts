export type Edge = 'left' | 'right' | 'top' | 'bottom';

type Box = Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>;

export const distanceToEdge = (container: Box, handle: Box, edge: Edge): number => {
	const middleX = (handle.left + handle.right) / 2;
	const middleY = (handle.top + handle.bottom) / 2;

	switch (edge) {
		case 'left': return middleX - container.left;
		case 'right': return container.right - middleX;
		case 'top': return middleY - container.top;
		case 'bottom': return container.bottom - middleY;
	}
};
