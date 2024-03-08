import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector,
} from '../../store/hooks';
import { MediaState } from '../../utils/types';
import {
	startVideoLabel,
	stopVideoLabel,
	videoUnsupportedLabel,
} from '../translated/translatedComponents';
import AddVideoIcon from '@mui/icons-material/VideoCall';
import StopVideoIcon from '@mui/icons-material/Cancel';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { uiActions } from '../../store/slices/uiSlice';
import { permissions } from '../../utils/roles';
import { stopExtraVideo } from '../../store/actions/mediaActions';

const ExtraVideoButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasExtraVideoPermission = usePermissionSelector(permissions.SHARE_EXTRA_VIDEO);
	const extraVideoEnabled = useAppSelector((state) => state.me.extraVideoEnabled);
	const { canSendWebcam, videoInProgress } = useAppSelector((state) => state.me);

	let videoState: MediaState, videoTip;

	if (!canSendWebcam || !hasExtraVideoPermission) {
		videoState = 'unsupported';
		videoTip = videoUnsupportedLabel();
	} else if (extraVideoEnabled) {
		videoState = 'on';
		videoTip = stopVideoLabel();
	} else {
		videoState = 'off';
		videoTip = startVideoLabel();
	}

	return (
		<ControlButton
			toolTip={videoTip}
			onClick={() => {
				if (videoState === 'unsupported') return;

				if (videoState === 'off') {
					dispatch(uiActions.setUi({ extraVideoDialogOpen: true }));
				} else {
					dispatch(stopExtraVideo());
				}
			}}
			disabled={videoState === 'unsupported' || videoInProgress}
			on={videoState === 'on'}
			{ ...props }
		>
			{ videoState === 'on' ? <StopVideoIcon /> : <AddVideoIcon />}
		</ControlButton>
	);
};

export default ExtraVideoButton;
