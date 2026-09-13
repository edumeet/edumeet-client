import { ReactNode } from 'react';
import { styled } from '@mui/material/styles';

interface StatsDivProps {
	flexdirection: 'row' | 'column';
	position: 'absolute' | 'relative';
	horizontal: 'left' | 'center' | 'right';
	vertical: 'top' | 'center' | 'bottom';
	withgap: number;
	withpadding: number;
	autohide: number;
}

type Offsets = {
	top?: string;
	right?: string;
	bottom?: string;
	left?: string;
};

const horizontalOffset = (horizontal: StatsDivProps['horizontal'], gutter: string): Offsets => {
	switch (horizontal) {
		case 'left':
			return { left: gutter };
		case 'right':
			return { right: gutter };
		default:
			return { left: '50%' };
	}
};

const verticalOffset = (vertical: StatsDivProps['vertical'], gutter: string): Offsets => {
	switch (vertical) {
		case 'top':
			return { top: gutter };
		case 'bottom':
			return { bottom: gutter };
		default:
			return { top: '50%' };
	}
};

const centeringTransform = (
	horizontal: StatsDivProps['horizontal'],
	vertical: StatsDivProps['vertical'],
): string | undefined => {
	const x = horizontal === 'center' ? '-50%' : '0';
	const y = vertical === 'center' ? '-50%' : '0';

	if (x === '0' && y === '0') return undefined;

	return `translate(${x}, ${y})`;
};

/**
 * The stats overlay ("quality window"). It hugs its content instead of
 * covering a fixed half of the tile, and scrolls internally when the tile is
 * too small for everything we have to say about the track.
 */
const StatsDiv = styled('div')<StatsDivProps>(({
	theme,
	flexdirection,
	position,
	horizontal,
	vertical,
	withgap: withGap,
	withpadding: withPadding,
	autohide: autoHide,
}) => {
	const gutter = theme.spacing(1);

	return {
		...(position === 'absolute' && {
			...horizontalOffset(horizontal, gutter),
			...verticalOffset(vertical, gutter),
			transform: centeringTransform(horizontal, vertical),
			maxWidth: `calc(100% - 2 * ${gutter})`,
			maxHeight: `calc(100% - 2 * ${gutter})`,
			overflow: 'auto',
		}),
		position,
		display: 'flex',
		flexDirection: flexdirection,
		alignItems: flexdirection === 'row' ? 'center' : 'flex-start',
		...(withGap && {
			gap: theme.spacing(0.5),
		}),
		...(withPadding && {
			padding: theme.spacing(0.75, 1),
		}),
		...(autoHide && {
			transition: 'opacity 0.25s ease',
			'&:hover': {
				opacity: 1,
			},
			opacity: 0.2,
		}),
		boxSizing: 'border-box',
		fontSize: '0.7rem',
		lineHeight: 1.35,
		color: 'white',
		backgroundColor: 'rgba(0, 0, 0, 0.72)',
		borderRadius: theme.shape.borderRadius,
		pointerEvents: 'auto',
		zIndex: 15,
	};
});

interface StatsProps {
	orientation?: 'horizontal' | 'vertical';
	horizontalPlacement?: 'left' | 'center' | 'right';
	verticalPlacement?: 'top' | 'center' | 'bottom';
	position?: 'absolute' | 'relative';
	withGap?: boolean;
	withPadding?: boolean;
	autoHide?: boolean;
	children?: ReactNode;
}

const Stats = ({
	orientation = 'vertical',
	horizontalPlacement: horizontal = 'center',
	verticalPlacement: vertical = 'center',
	position = 'absolute',
	withGap = false,
	withPadding = true,
	autoHide = false,
	children,
}: StatsProps): React.JSX.Element => {
	return (
		<StatsDiv
			flexdirection={orientation === 'horizontal' ? 'row' : 'column'}
			position={position}
			horizontal={horizontal}
			vertical={vertical}
			withgap={withGap ? 1 : 0}
			withpadding={withPadding ? 1 : 0}
			autohide={autoHide ? 1 : 0}
			children={children}
		/>
	);
};

export default Stats;
