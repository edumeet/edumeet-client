import {
	shareFileLabel,
	shareLabel,
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
import AddVideoIcon from '@mui/icons-material/VideoCall';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { uiActions } from '../../store/slices/uiSlice';

const ShareButton = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasExtraVideoPermission = usePermissionSelector(permissions.SHARE_EXTRA_VIDEO);
	const hasFilesharingPermission = usePermissionSelector(permissions.SHARE_FILE);

	const {
		canSendWebcam,
		videoInProgress,
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
		<SpeedDial
			ariaLabel={shareLabel()}
			icon={<AddIcon />}
			direction='up'
			FabProps={{ size: 'small' }}
		>
			{ canSendWebcam && !videoInProgress && (
				<SpeedDialAction
					icon={<AddVideoIcon />}
					tooltipTitle={videoTip}
					onClick={() => {
						if (videoState === 'unsupported') return;

						if (videoState === 'off') {
							dispatch(uiActions.setUi({ extraVideoDialogOpen: true }));
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