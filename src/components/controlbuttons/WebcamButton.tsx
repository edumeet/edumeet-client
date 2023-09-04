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
import { stopLiveWebcam, updateLiveWebcam } from '../../store/actions/mediaActions';

const WebcamButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasVideoPermission = usePermissionSelector(permissions.SHARE_VIDEO);
	const webcamProducer = useAppSelector(webcamProducerSelector);
	const { videoInProgress } = useAppSelector((state) => state.media);
	const {	canSendWebcam } = useAppSelector((state) => state.me);

	let webcamState!: MediaState, webcamTip;

	if (!canSendWebcam || !hasVideoPermission) {
		webcamState = 'unsupported';
		webcamTip = videoUnsupportedLabel();
	} else if (webcamProducer) {
		webcamState = 'on';
		webcamTip = stopVideoLabel();
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