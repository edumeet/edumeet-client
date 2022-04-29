import { MenuItem } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector,
} from '../../store/hooks';
import {
	screenSharingUnsupportedLabel,
	ShareScreenMessage,
	startScreenSharingLabel,
} from '../translated/translatedComponents';
import ScreenIcon from '@mui/icons-material/ScreenShare';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import { updateScreenSharing } from '../../store/actions/mediaActions';
import MoreActions from '../moreactions/MoreActions';

const Screenshare = ({
	onClick
}: MenuItemProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasScreenPermission = usePermissionSelector(permissions.SHARE_SCREEN);

	const {
		canShareScreen,
		screenSharingInProgress
	} = useAppSelector((state) => state.me);

	let screenState: MediaState, screenTip;

	if (!canShareScreen || !hasScreenPermission) {
		screenState = 'unsupported';
		screenTip = screenSharingUnsupportedLabel();
	} else {
		screenState = 'off';
		screenTip = startScreenSharingLabel();
	}

	return (
		<MenuItem
			aria-label={screenTip}
			disabled={screenState === 'unsupported' || screenSharingInProgress}
			onClick={() => {
				onClick();

				if (screenState === 'unsupported') return;

				if (screenState === 'off') {
					dispatch(updateScreenSharing({
						start: true
					}));
				} else {
					// Shouldn't happen
				}
			}}
		>
			<ScreenIcon />
			<MoreActions>
				<ShareScreenMessage />
			</MoreActions>
		</MenuItem>
	);
};

export default Screenshare;