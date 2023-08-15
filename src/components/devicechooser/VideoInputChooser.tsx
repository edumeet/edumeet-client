import { Button } from '@mui/material';
import { useEffect } from 'react';
import { stopPreviewWebcam, updatePreviewWebcam, updateLiveWebcam } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import { meProducersSelector } from '../../store/selectors';
import {
	applyLabel,
	noVideoDevicesLabel,
	selectVideoDeviceLabel,
	videoDeviceLabel
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
	const { webcamProducer } = useAppSelector(meProducersSelector);
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
			dispatch(updateLiveWebcam());
		}
	};

	return (
		<ChooserDiv>
			<DeviceChooser
				value={previewVideoDeviceId ?? ''}
				setValue={handleDeviceChange}
				name={videoDeviceLabel()}
				devicesLabel={selectVideoDeviceLabel()}
				noDevicesLabel={noVideoDevicesLabel()}
				disabled={videoDevices.length === 0 || videoInProgress}
				devices={videoDevices}
			/>
			{ withConfirm && webcamProducer && (
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