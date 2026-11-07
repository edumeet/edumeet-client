import { RefObject, useEffect, useState } from 'react';

export interface ElementSize {
	width: number;
	height: number;
}

// Size of an element, updated at most once per frame while it changes. Meant
// as effect dependencies (width and height separately) to lay out content
// again.
export const useElementSize = (ref: RefObject<HTMLElement | null>): ElementSize => {
	const [ size, setSize ] = useState<ElementSize>({ width: 0, height: 0 });

	useEffect(() => {
		const element = ref.current;

		if (!element) return;

		let frame: number | undefined;

		const observer = new ResizeObserver(() => {
			if (frame !== undefined) return;

			frame = requestAnimationFrame(() => {
				frame = undefined;

				const width = element.clientWidth;
				const height = element.clientHeight;

				// Keep the same object when nothing changed, so no render follows.
				setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
			});
		});

		observer.observe(element);

		return () => {
			if (frame !== undefined) cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}, [ ref ]);

	return size;
};
