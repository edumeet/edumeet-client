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
import { mediaActions } from '../../store/slices/mediaSlice';

const WebcamPreviewButton = (props: ControlButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();

	const { previewVideoDeviceId,
		previewWebcamTrackId,
		videoInProgress	} = useAppSelector((state) => state.media);

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
				if (webcamState === 'off') {
					dispatch(updatePreviewWebcam(previewVideoDeviceId));
				} else {
					dispatch(mediaActions.setVideoMuted(true));
					dispatch(stopPreviewWebcam());
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