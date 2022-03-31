import { ReactNode } from 'react';
import { Fab, Tooltip } from '@mui/material';
import { ButtonColor, ButtonSize } from '../../utils/types';

export interface InternalControlButtonProps {
	toolTip: string;
	toolTipLocation?: 'left' | 'bottom';
	disabled?: boolean;
	on?: boolean;
	onColor?: ButtonColor;
	offColor?: ButtonColor;
	disabledColor?: ButtonColor;
	size?: ButtonSize;
	onClick: () => void;
	children?: ReactNode;
}

export type ControlButtonProps = Omit<InternalControlButtonProps, 'onClick' | 'children' | 'toolTip' | 'on'>;

const ControlButton = ({
	toolTip,
	toolTipLocation = 'left',
	disabled,
	on,
	onColor = 'default',
	offColor = 'error',
	disabledColor = 'default',
	size = 'large',
	onClick,
	children
}: InternalControlButtonProps): JSX.Element => {

	return (
		<Tooltip
			title={toolTip}
			placement={toolTipLocation}
		>
			<div>
				<Fab
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