import { RefObject, useEffect, useState } from 'react';

// Width plus height of an element, updated at most once per frame while it
// changes size. Meant as an effect dependency to lay out content again.
export const useElementSize = (ref: RefObject<HTMLElement | null>): number => {
	const [ size, setSize ] = useState(0);

	useEffect(() => {
		const element = ref.current;

		if (!element) return;

		let frame: number | undefined;

		const observer = new ResizeObserver(() => {
			if (frame !== undefined) return;

			frame = requestAnimationFrame(() => {
				frame = undefined;
				setSize(element.clientWidth + element.clientHeight);
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
