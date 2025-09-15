import { memo, ReactNode } from 'react';
import { Fab, IconButton, Tooltip } from '@mui/material';
import { ButtonColor, ButtonSize } from '../../utils/types';

export interface ControlButtonProps {
	type?: 'fab' | 'iconbutton';
	toolTip?: string;
	toolTipLocation?: 'left' | 'bottom';
	disabled?: boolean;
	variant?: 'circular' | 'extended';
	on?: boolean;
	onColor?: ButtonColor;
	offColor?: ButtonColor;
	disabledColor?: ButtonColor;
	size?: ButtonSize;
	sx?: object;
	// eslint-disable-next-line
	onClick?: (event?: any) => void;
	children?: ReactNode;
}

const ControlButton = ({
	type = 'fab',
	toolTip,
	toolTipLocation = type === 'fab' ? 'left' : 'bottom',
	disabled,
	variant,
	on,
	onColor = 'inherit',
	offColor = 'inherit',
	disabledColor = 'inherit',
	size = 'small',
	onClick,
	sx,
	children
}: ControlButtonProps): JSX.Element => {
	const Button = ((type === 'fab') ? Fab : IconButton) as React.ElementType;

	return (
		<Tooltip
			title={toolTip || ''}
			placement={toolTipLocation}
		>
			<div>
				<Button
					sx={sx}
					aria-label={toolTip}
					disabled={disabled}
					color={disabled ? disabledColor : on ? onColor : offColor}
					size={size}
					onClick={onClick}
					children={children}
					variant={variant}
				/>
			</div>
		</Tooltip>
	);
};

export default memo(ControlButton);
