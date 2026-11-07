import { KeyboardEvent, PointerEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

const KEYBOARD_STEP = 16;

// Width of the area the pointer can grab. It is wider than the gap it sits
// on so that it is easy to hit, and negative margins keep the gap as it is.
const GRAB_SIZE = 8;

// 'vertical' is a vertical line between areas next to each other,
// 'horizontal' a horizontal line between areas above each other.
export type ResizeHandleOrientation = 'vertical' | 'horizontal';

interface HandleProps {
	orientation: ResizeHandleOrientation;
	active: number;
}

const Handle = styled(Box, {
	shouldForwardProp: (prop) => prop !== 'orientation' && prop !== 'active',
})<HandleProps>(({ theme, orientation, active }) => {
	const vertical = orientation === 'vertical';
	// Half the grab size, minus half the gap between the two areas.
	const overlap = (GRAB_SIZE / 2) + (parseInt(theme.spacing(0.5)) / 2);

	return {
		flex: '0 0 auto',
		alignSelf: 'stretch',
		position: 'relative',
		zIndex: 1,
		touchAction: 'none',
		outline: 'none',
		cursor: vertical ? 'col-resize' : 'row-resize',
		...(vertical ?
			{ width: GRAB_SIZE, margin: `0 -${overlap}px` } :
			{ height: GRAB_SIZE, margin: `-${overlap}px 0` }),
		// Always visible: a thin line along the middle 80% of the divider with a
		// grip in the middle. Both light up while hovered, focused or dragged.
		'&::before': {
			content: '""',
			position: 'absolute',
			backgroundColor: active ? theme.palette.primary.main : theme.palette.grey[300],
			opacity: active ? 0.8 : 0.35,
			transition: 'opacity 150ms, background-color 150ms',
			...(vertical ?
				{ top: '10%', bottom: '10%', left: (GRAB_SIZE / 2) - 1, width: 2 } :
				{ left: '10%', right: '10%', top: (GRAB_SIZE / 2) - 1, height: 2 }),
		},
		'&::after': {
			content: '""',
			position: 'absolute',
			borderRadius: 3,
			backgroundColor: active ? theme.palette.primary.main : theme.palette.grey[200],
			boxShadow: '0 0 3px rgba(0, 0, 0, 0.5)',
			opacity: active ? 1 : 0.9,
			transition: 'opacity 150ms, background-color 150ms',
			...(vertical ?
				{ top: '50%', left: 1, width: 6, height: 56, transform: 'translateY(-50%)' } :
				{ left: '50%', top: 1, height: 6, width: 56, transform: 'translateX(-50%)' }),
		},
		'&:hover::before, &:focus-visible::before': {
			backgroundColor: theme.palette.primary.main,
			opacity: 0.8,
		},
		'&:hover::after, &:focus-visible::after': {
			backgroundColor: theme.palette.primary.main,
			opacity: 1,
		},
	};
});

export interface ResizeHandleCallbacks {
	// Dragging starts. Gets the handle, to measure from.
	// eslint-disable-next-line no-unused-vars
	onResizeStart: (handle: HTMLElement) => void;
	// The pointer moved by delta px since the start, along the axis the handle
	// moves on: positive is right or down.
	// eslint-disable-next-line no-unused-vars
	onResize: (delta: number) => void;
	onResizeEnd: () => void;
	// Dragging stops without a result, as when the handle goes away mid-drag.
	onResizeCancel: () => void;
	// One keyboard step of delta px; +-Infinity for Home and End.
	// eslint-disable-next-line no-unused-vars
	onStep: (handle: HTMLElement, delta: number) => void;
	// Position of the handle and its limits, in percent, for assistive
	// technology; undefined while it cannot be measured.
	// eslint-disable-next-line no-unused-vars
	describe: (handle: HTMLElement) => HandlePosition | undefined;
}

export interface HandlePosition {
	now: number;
	min: number;
	max: number;
}

interface ResizeHandleProps extends ResizeHandleCallbacks {
	orientation: ResizeHandleOrientation;
	label: string;
	// Back to the default size, on double click.
	onReset: () => void;
}

const ResizeHandle = ({
	orientation,
	label,
	onResizeStart,
	onResize,
	onResizeEnd,
	onResizeCancel,
	onStep,
	describe,
	onReset,
}: ResizeHandleProps): React.JSX.Element => {
	const [ dragging, setDragging ] = useState(false);
	const [ value, setValue ] = useState<HandlePosition | undefined>();
	const handle = useRef<HTMLDivElement>(null);
	// The drag in progress: where it started, and the one pointer driving it.
	const drag = useRef<{ start: number; pointerId: number } | undefined>(undefined);
	// Body styles from before the drag, to put back afterwards.
	const bodyStyle = useRef({ cursor: '', userSelect: '' });
	const cancel = useRef(onResizeCancel);
	const vertical = orientation === 'vertical';

	cancel.current = onResizeCancel;

	const restoreBody = () => {
		document.body.style.cursor = bodyStyle.current.cursor;
		document.body.style.userSelect = bodyStyle.current.userSelect;
	};

	// Keep the reported position current. It follows the layout, so measure
	// after every render (the parent renders again when the layout changes)
	// and only store a changed value.
	useLayoutEffect(() => {
		const next = handle.current ? describe(handle.current) : undefined;

		setValue((current) => (
			current?.now === next?.now && current?.min === next?.min && current?.max === next?.max ? current : next
		));
	});

	// Ends a drag without a result: puts the page styles back and drops the
	// unfinished size.
	const cancelDrag = () => {
		const current = drag.current;

		if (!current) return;

		drag.current = undefined;
		restoreBody();

		if (handle.current?.hasPointerCapture(current.pointerId))
			handle.current.releasePointerCapture(current.pointerId);

		cancel.current();
	};

	// The handle can go away while it is dragged, for example when the last
	// screen share ends.
	useEffect(() => () => cancelDrag(), []);

	// The layout can turn while the handle is dragged, for example when the
	// window or the number of videos changes. The drag was measured along the
	// other axis, so it cannot go on.
	const previousOrientation = useRef(orientation);

	useEffect(() => {
		if (previousOrientation.current === orientation) return;

		previousOrientation.current = orientation;

		if (!drag.current) return;

		cancelDrag();
		setDragging(false);
	}, [ orientation ]);

	const position = (event: PointerEvent) => (vertical ? event.clientX : event.clientY);

	const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
		// One pointer drives a drag; a second finger on the handle is ignored.
		if (event.button !== 0 || drag.current) return;

		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);

		drag.current = { start: position(event), pointerId: event.pointerId };
		setDragging(true);
		onResizeStart(event.currentTarget);

		// Keep the cursor and avoid selecting text while dragging across the page.
		bodyStyle.current = { cursor: document.body.style.cursor, userSelect: document.body.style.userSelect };
		document.body.style.cursor = vertical ? 'col-resize' : 'row-resize';
		document.body.style.userSelect = 'none';
	};

	const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
		if (!drag.current || event.pointerId !== drag.current.pointerId) return;

		onResize(position(event) - drag.current.start);
	};

	const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
		if (!drag.current || event.pointerId !== drag.current.pointerId) return;

		drag.current = undefined;
		setDragging(false);
		restoreBody();

		if (event.currentTarget.hasPointerCapture(event.pointerId))
			event.currentTarget.releasePointerCapture(event.pointerId);

		onResizeEnd();
	};

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		// Enter goes back to the default, like a double click.
		if (event.key === 'Enter') {
			event.preventDefault();
			onReset();

			return;
		}

		const step = event.shiftKey ? KEYBOARD_STEP * 4 : KEYBOARD_STEP;
		const keys: Record<string, number> = vertical ?
			{ ArrowLeft: -step, ArrowRight: step, Home: -Infinity, End: Infinity } :
			{ ArrowUp: -step, ArrowDown: step, Home: -Infinity, End: Infinity };
		const delta = keys[event.key];

		if (delta === undefined) return;

		event.preventDefault();
		onStep(event.currentTarget, delta);
	};

	return (
		<Handle
			ref={handle}
			orientation={orientation}
			active={dragging ? 1 : 0}
			role='separator'
			aria-orientation={orientation}
			aria-label={label}
			aria-valuenow={value?.now}
			aria-valuemin={value?.min}
			aria-valuemax={value?.max}
			aria-valuetext={value ? `${value.now}%` : undefined}
			tabIndex={0}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={stopDragging}
			onPointerCancel={stopDragging}
			onLostPointerCapture={stopDragging}
			onDoubleClick={onReset}
			onKeyDown={onKeyDown}
		/>
	);
};

export default ResizeHandle;
