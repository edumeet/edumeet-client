import { Button } from '@mui/material';
import { updatePreviewWebcam, updateLiveWebcam } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import {
	applyLabel,
	noVideoDevicesLabel,
	selectVideoDeviceLabel,
} from '../translated/translatedComponents';
import DeviceChooser, { ChooserDiv } from './DeviceChooser';
import { mediaActions } from '../../store/slices/mediaSlice';

interface VideoInputChooserProps {
	withConfirm?: boolean;
}

const VideoInputChooser = ({
	withConfirm
}: VideoInputChooserProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const videoDevices = useDeviceSelector('videoinput');
	const { videoInProgress, previewVideoDeviceId, previewBlurBackground } = useAppSelector((state) => state.media);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			dispatch(updatePreviewWebcam(deviceId));
		}
	};

	const handleConfirm = (): void => {
		if (previewVideoDeviceId) {
			dispatch(mediaActions.setLiveVideoDeviceId(previewVideoDeviceId));
			dispatch(mediaActions.setLiveBlurBackground(previewBlurBackground));
			dispatch(mediaActions.setVideoMuted(false));
			dispatch(updateLiveWebcam());
		}
	};

	return (
		<ChooserDiv>
			<DeviceChooser
				value={previewVideoDeviceId ?? ''}
				setValue={handleDeviceChange}
				devicesLabel={selectVideoDeviceLabel()}
				noDevicesLabel={noVideoDevicesLabel()}
				disabled={videoDevices.length === 0 || videoInProgress}
				devices={videoDevices}
			/>
			{ withConfirm && (
				<Button
					onClick={handleConfirm}
					disabled={videoInProgress}
				>
					{ applyLabel() }
				</Button>
			)}
		</ChooserDiv>
	);
};

export default VideoInputChooser;