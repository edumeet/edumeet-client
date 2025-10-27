import { MenuItem } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import {
	showSettingsLabel,
} from '../translated/translatedComponents';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreActions from '../moreactions/MoreActions';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import { uiActions } from '../../store/slices/uiSlice';

const Settings = ({
	onClick
}: MenuItemProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const settingsOpen = useAppSelector((state) => state.ui.settingsOpen);

	return (
		<MenuItem
			aria-label={showSettingsLabel()}
			onClick={() => {
				onClick();
				dispatch(uiActions.setUi({ settingsOpen: !settingsOpen }));
			}}
		>
			<SettingsIcon />
			<MoreActions>
				{ showSettingsLabel() }
			</MoreActions>
		</MenuItem>
	);
};

export default Settings;