import { MenuItem } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector,
} from '../../store/hooks';
import {
	ExtraVideoMessage,
	startVideoLabel,
	videoUnsupportedLabel,
} from '../translated/translatedComponents';
import AddVideoIcon from '@mui/icons-material/VideoCall';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import { updateWebcam } from '../../store/actions/mediaActions';
import MoreActions from '../moreactions/MoreActions';

const ExtraVideo = ({
	onClick
}: MenuItemProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasExtraVideoPermission = usePermissionSelector(permissions.EXTRA_VIDEO);

	const {
		canSendWebcam,
		videoInProgress
	} = useAppSelector((state) => state.me);

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
					dispatch(updateWebcam({
						start: true
					}));
				} else {
					// Shouldn't happen
				}
			}}
		>
			<AddVideoIcon />
			<MoreActions>
				<ExtraVideoMessage />
			</MoreActions>
		</MenuItem>
	);
};

export default ExtraVideo;