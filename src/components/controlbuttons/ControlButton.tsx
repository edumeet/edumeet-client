import { memo, ReactNode } from 'react';
import { Fab, IconButton, Tooltip } from '@mui/material';
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
	// eslint-disable-next-line
	onClick?: (event?: any) => void;
	children?: ReactNode;
}

const ControlButton = ({
	type = 'fab',
	toolTip,
	toolTipLocation = type === 'fab' ? 'left' : 'bottom',
	disabled,
	on,
	onColor = 'inherit',
	offColor = 'inherit',
	disabledColor = 'inherit',
	size = 'small',
	onClick,
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

export default memo(ControlButton);