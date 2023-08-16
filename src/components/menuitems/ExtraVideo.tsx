import { MenuItem } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector,
} from '../../store/hooks';
import {
	startVideoLabel,
	videoUnsupportedLabel,
} from '../translated/translatedComponents';
import AddVideoIcon from '@mui/icons-material/VideoCall';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import MoreActions from '../moreactions/MoreActions';
import { uiActions } from '../../store/slices/uiSlice';

const ExtraVideo = ({
	onClick
}: MenuItemProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasExtraVideoPermission = usePermissionSelector(permissions.SHARE_EXTRA_VIDEO);

	const {
		canSendWebcam
	} = useAppSelector((state) => state.me);
	const {
		videoInProgress
	} = useAppSelector((state) => state.media);
	
	let videoState: MediaState, videoTip;

	if (!canSendWebcam || !hasExtraVideoPermission) {
		videoState = 'unsupported';
		videoTip = videoUnsupportedLabel();
	} else {
		videoState = 'off';
		videoTip = startVideoLabel();
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
			<AddVideoIcon />
			<MoreActions>
				{ videoTip }
			</MoreActions>
		</MenuItem>
	);
};

export default ExtraVideo;