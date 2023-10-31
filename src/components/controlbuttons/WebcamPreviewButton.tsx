import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { MediaState } from '../../utils/types';
import {
	stopVideoLabel,
	startVideoLabel
} from '../translated/translatedComponents';
import VideoIcon from '@mui/icons-material/Videocam';
import VideoOffIcon from '@mui/icons-material/VideocamOff';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	updatePreviewWebcam,
	stopPreviewWebcam
} from '../../store/actions/mediaActions';
import { meActions } from '../../store/slices/meSlice';

const WebcamPreviewButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const videoDevice = useAppSelector((state) => state.settings.selectedVideoDevice);

	const {
		previewWebcamTrackId,
		videoInProgress,
	} = useAppSelector((state) => state.me);

	let webcamState: MediaState, webcamTip;

	if (previewWebcamTrackId) {
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
					dispatch(updatePreviewWebcam({ newDeviceId: videoDevice }));
					dispatch(meActions.setVideoMuted(false));
				} else if (previewWebcamTrackId) {
					dispatch(stopPreviewWebcam());
					dispatch(meActions.setVideoMuted(true));
				} else {
					// Shouldn't happen
				}
			}}
			disabled={videoInProgress}
			on={webcamState === 'on'}
			{ ...props }
		>
			{ webcamState === 'on' ? <VideoIcon /> : <VideoOffIcon /> }
		</ControlButton>
	);
};

export default WebcamPreviewButton;