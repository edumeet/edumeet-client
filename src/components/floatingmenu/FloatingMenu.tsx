import { ReactNode } from 'react';
import { Menu } from '@mui/material';

export interface MenuItemProps {
	onClick: () => void;
}

interface FloatingMenuProps {
	anchorEl: HTMLElement | null | undefined;
	open: boolean;
	onClose: () => void;
	children?: ReactNode;
}

const FloatingMenu = ({
	anchorEl,
	open,
	onClose,
	children
}: FloatingMenuProps): JSX.Element => {
	return (
		<Menu
			anchorEl={anchorEl}
			anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			transformOrigin={{ vertical: 'top', horizontal: 'left' }}
			open={open}
			onClose={onClose}
		>
			{ children }
		</Menu>
	);
};

export default FloatingMenu;