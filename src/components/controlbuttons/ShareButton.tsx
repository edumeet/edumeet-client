import {
	screenSharingUnsupportedLabel,
	shareFileLabel,
	shareLabel,
	startScreenSharingLabel,
	startVideoLabel,
	videoUnsupportedLabel
} from '../translated/translatedComponents';
import AddIcon from '@mui/icons-material/Add';
import { SpeedDial, SpeedDialAction } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import ScreenIcon from '@mui/icons-material/ScreenShare';
import AddVideoIcon from '@mui/icons-material/VideoCall';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
	updateScreenSharing,
	updateWebcam
} from '../../store/actions/mediaActions';
import { uiActions } from '../../store/slices/uiSlice';

const ShareButton = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasScreenPermission = usePermissionSelector(permissions.SHARE_SCREEN);
	const hasExtraVideoPermission = usePermissionSelector(permissions.EXTRA_VIDEO);
	const hasFilesharingPermission = usePermissionSelector(permissions.SHARE_FILE);

	const {
		canSendWebcam,
		videoInProgress,
		canShareScreen,
		screenSharingInProgress
	} = useAppSelector((state) => state.me);

	let videoState: MediaState, videoTip, screenState: MediaState, screenTip;

	if (!canSendWebcam || !hasExtraVideoPermission) {
		videoState = 'unsupported';
		videoTip = videoUnsupportedLabel();
	} else {
		videoState = 'off';
		videoTip = startVideoLabel();
	}

	if (!canShareScreen || !hasScreenPermission) {
		screenState = 'unsupported';
		screenTip = screenSharingUnsupportedLabel();
	} else {
		screenState = 'off';
		screenTip = startScreenSharingLabel();
	}

	return (
		<SpeedDial
			ariaLabel={shareLabel()}
			icon={<AddIcon />}
			direction='left'
		>
			{ canShareScreen && !screenSharingInProgress && (
				<SpeedDialAction
					icon={<ScreenIcon />}
					tooltipTitle={screenTip}
					onClick={() => {
						if (screenState === 'unsupported') return;

						if (screenState === 'off') {
							dispatch(updateScreenSharing({
								start: true
							}));
						} else {
							// Shouldn't happen
						}
					}}
				/>
			)}
			{ canSendWebcam && !videoInProgress && (
				<SpeedDialAction
					icon={<AddVideoIcon />}
					tooltipTitle={videoTip}
					onClick={() => {
						if (videoState === 'unsupported') return;

						if (videoState === 'off') {
							dispatch(updateWebcam({
								start: true
							}));
						} else {
							// Shouldn't happen
						}
					}}
				/>
			)}
			{ hasFilesharingPermission && (
				<SpeedDialAction
					icon={<UploadFileIcon />}
					tooltipTitle={shareFileLabel()}
					onClick={() => {
						dispatch(uiActions.setUi({ filesharingOpen: true }));
					}}
				/>
			)}
		</SpeedDial>
	);
};

export default ShareButton;