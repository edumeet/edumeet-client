import { ReactNode } from 'react';
import { styled } from '@mui/material/styles';

interface MediaControlsDivProps {
	flexdirection: 'row' | 'column';
	alignitems: string;
	justifycontent: string;
	position: 'absolute' | 'relative';
	withgap: number;
	withpadding: number;
}

const MediaControlsDiv = styled('div')<MediaControlsDivProps>(({
	theme,
	flexdirection,
	alignitems,
	justifycontent,
	position,
	withgap: withGap,
	withpadding: withPadding
}) => ({
	position,
	width: '100%',
	height: '100%',
	display: 'flex',
	...(withGap && {
		gap: theme.spacing(2)
	}),
	...(withPadding && {
		padding: theme.spacing(2)
	}),
	flexDirection: flexdirection,
	opacity: 0.2,
	alignItems: alignitems,
	justifyContent: justifycontent,
	zIndex: 21,
	transition: 'opacity 0.25s ease',
	'&:hover': {
		opacity: 1
	}
}));

interface MediaControlsProps {
	orientation?: 'horizontal' | 'vertical';
	horizontalPlacement?: 'left' | 'center' | 'right';
	verticalPlacement?: 'top' | 'center' | 'bottom';
	position?: 'absolute' | 'relative';
	withGap?: boolean;
	withPadding?: boolean;
	children?: ReactNode;
}

const MediaControls = ({
	orientation = 'vertical',
	horizontalPlacement = 'center',
	verticalPlacement = 'center',
	position = 'absolute',
	withGap = true,
	withPadding = true,
	children
}: MediaControlsProps): JSX.Element => {
	let justifyContent = 'center';
	let alignItems = 'center';

	if (horizontalPlacement === 'left') {
		orientation === 'horizontal' ?
			justifyContent = 'flex-start' : alignItems = 'flex-start';
	} else if (horizontalPlacement === 'right') {
		orientation === 'horizontal' ?
			justifyContent = 'flex-end' : alignItems = 'flex-end';
	}

	if (verticalPlacement === 'top') {
		orientation === 'horizontal' ?
			alignItems = 'flex-start': justifyContent = 'flex-start';
	} else if (verticalPlacement === 'bottom') {
		orientation === 'horizontal' ?
			alignItems = 'flex-end' : justifyContent = 'flex-end';
	}

	return (
		<MediaControlsDiv
			flexdirection={orientation === 'horizontal' ? 'row' : 'column'}
			position={position}
			alignitems={alignItems}
			justifycontent={justifyContent}
			withgap={withGap ? 1 : 0}
			withpadding={withPadding ? 1 : 0}
			children={children}
		/>
	);
};

export default MediaControls;