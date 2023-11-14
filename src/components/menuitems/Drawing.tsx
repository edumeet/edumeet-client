import { MenuItem } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector,
} from '../../store/hooks';
import {
	startDrawingLabel,
	stopDrawingLabel,
	// removeDrawingsLabel
} from '../translated/translatedComponents';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import { MediaState } from '../../utils/types';
import MoreActions from '../moreactions/MoreActions';
import { uiActions } from '../../store/slices/uiSlice';
import { permissions } from '../../utils/roles';
import DrawingIcon from '@mui/icons-material/Edit';
// import RemoveDrawingIcon from '@mui/icons-material/Backspace';

const Drawing = ({
	onClick
}: MenuItemProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasExtraVideoPermission = usePermissionSelector(permissions.SHARE_EXTRA_VIDEO);

	const {
		canSendWebcam,
		videoInProgress,
	} = useAppSelector((state) => state.me);

	let videoState: MediaState, videoTip;

	if (!canSendWebcam || !hasExtraVideoPermission) {
		videoState = 'unsupported';
		videoTip = stopDrawingLabel();
	} else {
		videoState = 'off';
		videoTip = startDrawingLabel();
	}

	return (
		<MenuItem
			aria-label={videoTip}
			disabled={videoState === 'unsupported' || videoInProgress}
			onClick={() => {
				onClick();

				if (videoState === 'unsupported') return;

				if (videoState === 'off') {
					dispatch(uiActions.setUi({ extraVideoDialogOpen: true }));
				} else {
					// Shouldn't happen
				}
			}}
		>
			<DrawingIcon />
			<MoreActions>
				{ videoTip }
			</MoreActions>
		</MenuItem>
	);
};

export default Drawing;