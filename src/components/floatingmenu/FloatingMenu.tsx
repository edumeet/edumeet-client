import { memo, ReactNode } from 'react';
import { Menu } from '@mui/material';

export interface MenuItemProps {
	onClick: () => void;
}

interface FloatingMenuProps {
	anchorEl: HTMLElement | null | undefined;
	anchorOrigin?: {
		vertical: number | 'top' | 'center' | 'bottom';
		horizontal: number | 'center' | 'left' | 'right';
	};
	transformOrigin?: {
		vertical: number | 'top' | 'center' | 'bottom';
		horizontal: number | 'center' | 'left' | 'right';
	};
	open: boolean;
	onClose: () => void;
	children?: ReactNode;
}

const FloatingMenu = ({
	anchorEl,
	anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
	transformOrigin = { vertical: 'top', horizontal: 'left' },
	open,
	onClose,
	children
}: FloatingMenuProps): JSX.Element => {
	return (
		<Menu
			anchorEl={anchorEl}
			anchorOrigin={anchorOrigin}
			transformOrigin={transformOrigin}
			open={open}
			onClose={onClose}
		>
			{ children }
		</Menu>
	);
};

export default memo(FloatingMenu);