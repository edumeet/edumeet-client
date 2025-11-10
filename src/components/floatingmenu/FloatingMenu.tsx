import { memo, ReactNode } from 'react';
import { styled } from '@mui/material/styles';
import { Menu } from '@mui/material';

export interface MenuItemProps {
	onClick: () => void;
}

const StyledMenu = styled(Menu)({
	'& .MuiList-root': {
		paddingTop: 0,
		paddingBottom: 0
	}
});

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
		<StyledMenu
			anchorEl={anchorEl}
			anchorOrigin={anchorOrigin}
			transformOrigin={transformOrigin}
			open={open}
			onClose={onClose}
		>
			{ children }
		</StyledMenu>
	);
};

export default memo(FloatingMenu);
