import { ReactNode } from 'react';
import { styled } from '@mui/material/styles';

interface StatsDivProps {
	flexdirection: 'row' | 'column';
	alignitems: string;
	justifycontent: string;
	position: 'absolute' | 'relative';
	withgap: number;
	withpadding: number;
	autohide: number;
}

const StatsDiv = styled('div')<StatsDivProps>(({
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
	width: '30%',
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
	fontSize: '0.8rem',
	color: 'white',
	alignItems: alignitems,
	justifyContent: justifycontent,

	/* zIndex: 20, */
}));

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
	horizontalPlacement = 'center',
	verticalPlacement = 'center',
	position = 'absolute',
	withGap = false,
	withPadding = true,
	autoHide = false,
	children
}: StatsProps): React.JSX.Element => {
	let justifyContent = 'center';
	let alignItems = 'center';

	if (horizontalPlacement === 'left') {
		if (orientation === 'horizontal') {
			justifyContent = 'flex-start';
		} else {
			alignItems = 'flex-start';
		}
	} else if (horizontalPlacement === 'right') {
		if (orientation === 'horizontal') { 
			justifyContent = 'flex-end'; 
		} else {
			alignItems = 'flex-end';
		}
	}

	if (verticalPlacement === 'top') {
		if (orientation === 'horizontal') {
			alignItems = 'flex-start';
		} else {
			justifyContent = 'flex-start';
		}

	} else if (verticalPlacement === 'bottom') {
		if (orientation === 'horizontal') {
			alignItems = 'flex-end';
		} else {
			justifyContent = 'flex-end';
		}

	}

	return (
		<StatsDiv
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

export default Stats;