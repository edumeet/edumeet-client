import { ReactNode } from 'react';
import { styled } from '@mui/material/styles';

interface MediaControlsDivProps {
	flexdirection: 'row' | 'column';
	alignitems: string;
	justifycontent: string;
	position: 'absolute' | 'relative';
	// eslint-disable-next-line
	onMouseOver?: (event?: any) => void;
	// eslint-disable-next-line
	onMouseOut?: (event?: any) => void;
}

const MediaControlsDiv = styled('div')<MediaControlsDivProps>(({
	theme,
	flexdirection,
	alignitems,
	justifycontent,
	position,
}) => ({
	position,
	width: '100%',
	height: '100%',
	display: 'flex',
	gap: theme.spacing(2),
	padding: theme.spacing(2),
	flexDirection: flexdirection,
	opacity: 0.2,
	alignItems: alignitems,
	justifyContent: justifycontent,
	zIndex: 21,
}));

interface MediaControlsProps {
	orientation?: 'horizontal' | 'vertical';
	horizontalPlacement?: 'left' | 'center' | 'right';
	verticalPlacement?: 'top' | 'center' | 'bottom';
	position?: 'absolute' | 'relative';
	children?: ReactNode;
}

const MediaControls = ({
	orientation = 'vertical',
	horizontalPlacement = 'center',
	verticalPlacement = 'center',
	position = 'absolute',
	children,
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

	const buttonMouseOverHandler = (
		event: React.MouseEvent<HTMLDivElement>
	) => {
		const btn: HTMLDivElement = event.currentTarget;

		btn.style.opacity = '1';
	};

	const buttonMouseOutHandler = (
		event: React.MouseEvent<HTMLDivElement>
	) => {
		const btn: HTMLDivElement = event.currentTarget;

		btn.style.opacity = '0.2';
		
	};

	return (
		<MediaControlsDiv
			onMouseOver={ buttonMouseOverHandler }
			onMouseOut={ buttonMouseOutHandler }
			flexdirection={orientation === 'horizontal' ? 'row' : 'column'}
			position={position}
			alignitems={alignItems}
			justifycontent={justifyContent}
			children={children}
		/>
	);
};

export default MediaControls;