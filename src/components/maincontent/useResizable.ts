import { useRef, useState } from 'react';
import { ResizeHandleCallbacks } from './ResizeHandle';

interface UseResizableOptions {
	// Current size in px of the area being resized, measured from the handle.
	// eslint-disable-next-line no-unused-vars
	measure: (handle: HTMLElement) => number;
	// Keeps a size within what is allowed.
	// eslint-disable-next-line no-unused-vars
	clamp: (size: number) => number;
	// Saves the final size.
	// eslint-disable-next-line no-unused-vars
	commit: (size: number) => void;
	// Size in px of the whole space the area takes its part of; the handle
	// reports the area's size as a percentage of it to assistive technology.
	total: () => number;
	// The area sits after the handle (right of or below it), so moving the
	// handle towards it makes it smaller.
	after?: boolean;
}

const percent = (size: number, total: number): number => Math.round((size / total) * 100);

// Size bookkeeping for a ResizeHandle. While dragging, the size lives in
// dragSize so that the store is only written once the drag ends.
export const useResizable = ({ measure, clamp, commit, total, after }: UseResizableOptions): {
	dragSize: number | undefined;
	handleProps: ResizeHandleCallbacks;
} => {
	const [ dragSize, setDragSize ] = useState<number | undefined>();
	const drag = useRef<{ start: number; size: number } | undefined>(undefined);
	const sign = after ? -1 : 1;

	return {
		dragSize,
		handleProps: {
			onResizeStart: (handle) => {
				const start = measure(handle);

				drag.current = { start, size: start };
			},
			onResize: (delta) => {
				if (!drag.current) return;

				const size = clamp(drag.current.start + (sign * delta));

				if (size === drag.current.size) return;

				drag.current.size = size;
				setDragSize(size);
			},
			onResizeEnd: () => {
				const current = drag.current;

				drag.current = undefined;
				setDragSize(undefined);

				// A plain click does not turn the default size into a fixed one.
				if (current && current.size !== current.start) commit(current.size);
			},
			onResizeCancel: () => {
				drag.current = undefined;
				setDragSize(undefined);
			},
			onStep: (handle, delta) => commit(clamp(measure(handle) + (sign * delta))),
			// Where the divider is, in percent of the whole space from its start
			// (left or top), so that left/up and Home always lower the value.
			describe: (handle) => {
				const whole = total();

				if (whole <= 0) return undefined;

				const position = (size: number) => (after ? 100 - percent(size, whole) : percent(size, whole));
				const [ min, max ] = after ? [ clamp(Infinity), clamp(0) ] : [ clamp(0), clamp(Infinity) ];

				return { now: position(measure(handle)), min: position(min), max: position(max) };
			},
		},
	};
};
