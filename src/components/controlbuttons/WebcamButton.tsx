import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { webcamProducerSelector } from '../../store/selectors';
import { producersActions } from '../../store/slices/producersSlice';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import {
	videoUnsupportedLabel,
	stopVideoLabel,
	startVideoLabel
} from '../translated/translatedComponents';
import VideoIcon from '@mui/icons-material/Videocam';
import VideoOffIcon from '@mui/icons-material/VideocamOff';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { stopLiveWebcam, updateLiveWebcam, updatePreviewMic, updatePreviewWebcam } from '../../store/actions/mediaActions';
import { uiActions } from '../../store/slices/uiSlice';

const WebcamButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasVideoPermission = usePermissionSelector(permissions.SHARE_VIDEO);
	const webcamProducer = useAppSelector(webcamProducerSelector);
	const { liveVideoDeviceId, videoInProgress } = useAppSelector((state) => state.media);
	const {	canSendWebcam } = useAppSelector((state) => state.me);
	const { settingsOpen } = useAppSelector((state) => state.ui);

	let webcamState!: MediaState, webcamTip;

	if (!canSendWebcam || !hasVideoPermission) {
		webcamState = 'unsupported';
		webcamTip = videoUnsupportedLabel();
	} else if (webcamProducer) {
		webcamState = 'on';
		webcamTip = stopVideoLabel();
	} else if (!webcamProducer && liveVideoDeviceId) {
		webcamState = 'muted';
		webcamTip = startVideoLabel();
	} else {
		webcamState = 'off';
		webcamTip = startVideoLabel();
	}

	return (
		<ControlButton
			toolTip={webcamTip}
			onClick={() => {
				if (webcamState === 'unsupported') return;

				if (webcamState === 'off') {
					dispatch(updatePreviewMic());
					dispatch(updatePreviewWebcam());
					dispatch(uiActions.setUi({ settingsOpen: !settingsOpen })); 
				}
					
				if (webcamState === 'muted') {
					dispatch(updateLiveWebcam());
				}

				if (webcamProducer) {
					dispatch(
						producersActions.closeProducer({
							producerId: webcamProducer.id,
							local: true,
							source: 'webcam'
						})
					);
					dispatch(stopLiveWebcam());
				}
			}}
			disabled={webcamState === 'unsupported' || videoInProgress}
			on={webcamState === 'on'}
			{ ...props }
		>
			{ webcamState === 'on' ? <VideoIcon /> : <VideoOffIcon /> }
		</ControlButton>
	);
};

export default WebcamButton;