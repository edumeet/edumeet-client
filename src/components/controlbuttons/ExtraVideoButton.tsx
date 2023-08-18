import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import {
	startVideoLabel,
	videoUnsupportedLabel,
} from '../translated/translatedComponents';
import AddVideoIcon from '@mui/icons-material/VideoCall';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { uiActions } from '../../store/slices/uiSlice';

const ExtraVideoButton = (props: ControlButtonProps): JSX.Element => {
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
		<ControlButton
			toolTip={videoTip}
			onClick={() => {
				if (videoState === 'unsupported') return;

				if (videoState === 'off') {
					dispatch(uiActions.setUi({ extraVideoDialogOpen: true }));
				} else {
					// Shouldn't happen
				}
			}}
			disabled={videoState === 'unsupported' || videoInProgress}
			{ ...props }
		>
			<AddVideoIcon />
		</ControlButton>
	);
};

export default ExtraVideoButton;