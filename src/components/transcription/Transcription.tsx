import { ReactNode } from 'react';
import { styled } from '@mui/material/styles';

interface TranscriptionDivProps {
	flexdirection: 'row' | 'column';
	alignitems: string;
	justifycontent: string;
	position: 'absolute' | 'relative';
	withgap: number;
	withpadding: number;
	autohide: number;
}

const TranscriptionDiv = styled('div')<TranscriptionDivProps>(({
	theme,
	flexdirection,
	alignitems,
	justifycontent,
	position,
	withgap: withGap,
	withpadding: withPadding,
	autohide: autoHide
}) => ({
	position,
	width: '100%',
	height: '100%',
	display: 'flex',
	...(withGap && {
		gap: theme.spacing(1)
	}),
	...(withPadding && {
		padding: theme.spacing(4)
	}),
	flexDirection: flexdirection,
	...(autoHide && {
		transition: 'opacity 0.25s ease',
		'&:hover': {
			opacity: 1
		},
		opacity: 0.2,
	}),
	alignItems: alignitems,
	justifyContent: justifycontent,
}));

interface TranscriptionProps {
	orientation?: 'horizontal' | 'vertical';
	horizontalPlacement?: 'left' | 'center' | 'right';
	verticalPlacement?: 'top' | 'center' | 'bottom';
	position?: 'absolute' | 'relative';
	withGap?: boolean;
	withPadding?: boolean;
	autoHide?: boolean;
	children?: ReactNode;
}

const Transcription = ({
	orientation = 'vertical',
	horizontalPlacement = 'center',
	verticalPlacement = 'center',
	position = 'absolute',
	withGap = false,
	withPadding = true,
	autoHide = false,
	children
}: TranscriptionProps): JSX.Element => {
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
		<TranscriptionDiv
			flexdirection={orientation === 'horizontal' ? 'row' : 'column'}
			position={position}
			alignitems={alignItems}
			justifycontent={justifyContent}
			withgap={withGap ? 1 : 0}
			withpadding={withPadding ? 1 : 0}
			autohide={autoHide ? 1 : 0}
			children={children}
		/>
	);
};

export default Transcription;