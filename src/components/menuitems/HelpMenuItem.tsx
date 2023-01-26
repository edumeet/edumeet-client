import { MenuItem } from '@mui/material';
import { Help } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { helpLabel } from '../translated/translatedComponents';
import { uiActions } from '../../store/slices/uiSlice';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';

const HelpMenuItem = ({
	onClick
}: MenuItemProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const helpOpen = useAppSelector((state) => state.ui.helpOpen);

	return (
		<MenuItem
			aria-label={ helpLabel() }
			onClick={ () => {
				onClick();
				dispatch(uiActions.setUi({ helpOpen: !helpOpen }));
			} }
		>
			<Help />
			<MoreActions>
				{ helpLabel() }
			</MoreActions>
		</MenuItem>
	);
};

export default HelpMenuItem;