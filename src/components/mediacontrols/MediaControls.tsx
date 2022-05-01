import { ReactNode } from 'react';
import { styled } from '@mui/material/styles';

interface MediaControlsDivProps {
	flexdirection: 'row' | 'column';
	alignitems: string;
	justifycontent: string;
}

const MediaControlsDiv = styled('div')<MediaControlsDivProps>(({
	theme,
	flexdirection,
	alignitems,
	justifycontent
}) => ({
	position: 'absolute',
	width: '100%',
	height: '100%',
	display: 'flex',
	gap: theme.spacing(2),
	padding: theme.spacing(2),
	flexDirection: flexdirection,
	alignItems: alignitems,
	justifyContent: justifycontent,
	zIndex: 21,
}));

interface MediaControlsProps {
	orientation?: 'horizontal' | 'vertical';
	horizontalPlacement?: 'left' | 'center' | 'right';
	verticalPlacement?: 'top' | 'center' | 'bottom';
	children?: ReactNode;
}

const MediaControls = ({
	orientation = 'vertical',
	horizontalPlacement = 'center',
	verticalPlacement = 'center',
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
			alignitems={alignItems}
			justifycontent={justifyContent}
			children={children}
		/>
	);
};

export default MediaControls;