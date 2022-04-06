import { ReactNode } from 'react';
import { Fab, IconButton, styled, Tooltip } from '@mui/material';
import { ButtonColor, ButtonSize } from '../../utils/types';

export interface ControlButtonProps {
	type?: 'fab' | 'iconbutton';
	toolTip?: string;
	toolTipLocation?: 'left' | 'bottom';
	disabled?: boolean;
	on?: boolean;
	onColor?: ButtonColor;
	offColor?: ButtonColor;
	disabledColor?: ButtonColor;
	size?: ButtonSize;
	onClick?: () => void;
	children?: ReactNode;
}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
	margin: theme.spacing(1, 0),
	padding: theme.spacing(0, 1)
}));

const ControlButton = ({
	type = 'fab',
	toolTip,
	toolTipLocation = 'bottom',
	disabled,
	on,
	onColor = 'inherit',
	offColor = 'inherit',
	disabledColor = 'inherit',
	size = 'large',
	onClick,
	children
}: ControlButtonProps): JSX.Element => {
	const Button = ((type === 'fab') ? Fab : StyledIconButton) as React.ElementType;

	return (
		<Tooltip
			title={toolTip || ''}
			placement={toolTipLocation}
		>
			<div>
				<Button
					aria-label={toolTip}
					disabled={disabled}
					color={
						disabled ? disabledColor : on ? onColor : offColor
					}
					size={size}
					onClick={onClick}
					children={children}
				/>
			</div>
		</Tooltip>
	);
};

export default ControlButton;