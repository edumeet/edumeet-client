import { memo, ReactNode } from 'react';
import { Fab, IconButton, Tooltip } from '@mui/material';
import { AutomationControl, ButtonColor, ButtonSize } from '../../utils/types';

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
	// eslint-disable-next-line
	onClick?: (event?: any) => void;
	children?: ReactNode;
	control?: AutomationControl;
	count?: number;
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
	children,
	control,
	count
}: ControlButtonProps): React.JSX.Element => {
	const Button = ((type === 'fab') ? Fab : IconButton) as React.ElementType;

	return (
		<Tooltip
			title={toolTip || ''}
			placement={toolTipLocation}
		>
			<div>
				<Button
					aria-label={toolTip}
					data-edumeet-control={control}
					data-edumeet-on={control ? String(Boolean(on)) : undefined}
					data-edumeet-count={count}
					disabled={disabled}
					color={disabled ? disabledColor : on ? onColor : offColor}
					size={size}
					onClick={onClick}
					children={children}
					variant={variant}
					tabIndex={-1}
				/>
			</div>
		</Tooltip>
	);
};

export default memo(ControlButton);
