import { MenuItem } from '@mui/material';
import { useIntl } from 'react-intl';
import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import {
	showSettingsLabel,
	ShowSettingsMessage
} from '../translated/translatedComponents';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreActions from '../moreactions/MoreActions';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import { uiActions } from '../../store/slices/uiSlice';

const Settings = ({
	onClick
}: MenuItemProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();
	const settingsOpen = useAppSelector((state) => state.ui.settingsOpen);

	return (
		<MenuItem
			aria-label={showSettingsLabel(intl)}
			onClick={() => {
				onClick();
				dispatch(uiActions.setUi({ settingsOpen: !settingsOpen }));
			}}
		>
			<SettingsIcon />
			<MoreActions>
				<ShowSettingsMessage />
			</MoreActions>
		</MenuItem>
	);
};

export default Settings;