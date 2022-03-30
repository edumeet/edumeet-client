import { ReactNode } from 'react';
import { Fab, Tooltip } from '@mui/material';

interface ControlButtonProps {
	toolTip: string;
	toolTipLocation?: 'left' | 'bottom';
	disabled?: boolean;
	color?: 'inherit' | 'error' | 'primary' | 'secondary' | 'default' | 'success' | 'info' | 'warning';
	size?: 'small' | 'medium' | 'large';
	onClick: () => void;
	children?: ReactNode;
}

const ControlButton = ({
	toolTip,
	toolTipLocation = 'left',
	disabled,
	color = 'primary',
	size = 'large',
	onClick,
	children
}: ControlButtonProps): JSX.Element => {

	return (
		<Tooltip
			title={toolTip}
			placement={toolTipLocation}
		>
			<div>
				<Fab
					aria-label={toolTip}
					disabled={disabled}
					color={color}
					size={size}
					onClick={onClick}
					children={children}
				/>
			</div>
		</Tooltip>
	);
};

export default ControlButton;