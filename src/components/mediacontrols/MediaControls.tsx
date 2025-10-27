import { memo, ReactNode } from 'react';
import { styled } from '@mui/material/styles';

interface MediaControlsDivProps {
	flexdirection: 'row' | 'column';
	fullsize: number;
	alignitems: string;
	justifycontent: string;
	position: 'absolute' | 'relative';
	withgap: number;
	autohide: number;
	pointerevents: number;
	left?: number;
	top?: number;
	right?: number;
	bottom?: number;
}

const MediaControlsDiv = styled('div')<MediaControlsDivProps>(({
	theme,
	flexdirection,
	fullsize,
	alignitems,
	justifycontent,
	position,
	withgap: withGap,
	autohide: autoHide,
	pointerevents: pointerEvents,
	left,
	top,
	right,
	bottom,
}) => ({
	position,
	...(fullsize && {
		width: '100%',
		height: '100%',
	}),
	display: 'flex',
	...(withGap && {
		gap: theme.spacing(2)
	}),
	flexDirection: flexdirection,
	...(autoHide && {
		transition: 'opacity 0.25s ease',
		'&:hover': {
			opacity: 1
		},
		opacity: 0,
	}),
	alignItems: alignitems,
	justifyContent: justifycontent,
	...(pointerEvents && {
		pointerEvents: 'none',
		'& > *': {
			pointerEvents: 'auto'
		}
	}),
	left: left ? theme.spacing(left) : undefined,
	top: top ? theme.spacing(top) : undefined,
	right: right ? theme.spacing(right) : undefined,
	bottom: bottom ? theme.spacing(bottom) : undefined,
}));

interface MediaControlsProps {
	orientation?: 'horizontal' | 'vertical';
	fullsize?: boolean;
	horizontalPlacement?: 'left' | 'center' | 'right';
	verticalPlacement?: 'top' | 'center' | 'bottom';
	position?: 'absolute' | 'relative';
	withGap?: boolean;
	autoHide?: boolean;
	pointerEvents?: boolean;
	children?: ReactNode;
}

const MediaControls = ({
	orientation = 'vertical',
	fullsize = true,
	horizontalPlacement = 'center',
	verticalPlacement = 'center',
	position = 'absolute',
	withGap = true,
	autoHide = true,
	pointerEvents = false,
	children
}: MediaControlsProps): React.JSX.Element => {
	let justifyContent = 'center';
	let alignItems = 'center';

	if (horizontalPlacement === 'left') orientation === 'horizontal' ? justifyContent = 'flex-start' : alignItems = 'flex-start';
	else if (horizontalPlacement === 'right') orientation === 'horizontal' ? justifyContent = 'flex-end' : alignItems = 'flex-end';

	if (verticalPlacement === 'top') orientation === 'horizontal' ? alignItems = 'flex-start': justifyContent = 'flex-start';
	else if (verticalPlacement === 'bottom') orientation === 'horizontal' ? alignItems = 'flex-end' : justifyContent = 'flex-end';

	return (
		<MediaControlsDiv
			flexdirection={orientation === 'horizontal' ? 'row' : 'column'}
			left={horizontalPlacement === 'left' ? 2 : undefined}
			top={verticalPlacement === 'top' ? 2 : undefined}
			right={horizontalPlacement === 'right' ? 2 : undefined}
			bottom={verticalPlacement === 'bottom' ? 2 : undefined}
			fullsize={fullsize ? 1 : 0}
			position={position}
			alignitems={alignItems}
			justifycontent={justifyContent}
			withgap={withGap ? 1 : 0}
			autohide={autoHide ? 1 : 0}
			pointerevents={pointerEvents ? 1 : 0}
			children={children}
		/>
	);
};

export default memo(MediaControls);