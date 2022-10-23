import { ReactNode } from 'react';
import { styled } from '@mui/material/styles';

interface MediaControlsDivProps {
	flexdirection: 'row' | 'column';
	alignitems: string;
	justifycontent: string;
	position: 'absolute' | 'relative';
	withGap?: boolean;
	withPadding?: boolean;
}

const MediaControlsDiv = styled('div')<MediaControlsDivProps>(({
	theme,
	flexdirection,
	alignitems,
	justifycontent,
	position,
	withGap,
	withPadding
}) => ({
	position,
	width: '100%',
	height: '100%',
	display: 'flex',
	gap: withGap ? theme.spacing(2) : 0,
	padding: withPadding ? theme.spacing(2) : 0,
	flexDirection: flexdirection,
	alignItems: alignitems,
	justifyContent: justifycontent,
	zIndex: 21,
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
			withGap={withGap}
			withPadding={withPadding}
			children={children}
		/>
	);
};

export default MediaControls;