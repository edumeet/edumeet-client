import { Button } from '@mui/material';
import { useState } from 'react';
import { updatePreviewWebcam, updateWebcam } from '../../store/actions/mediaActions';
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
import { settingsActions } from '../../store/slices/settingsSlice';

interface VideoInputChooserProps {
	withConfirm?: boolean;
}

const VideoInputChooser = ({
	withConfirm
}: VideoInputChooserProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const { webcamProducer } = useAppSelector(meProducersSelector);
	const videoDevices = useDeviceSelector('videoinput');
	const videoInProgress = useAppSelector((state) => state.me.videoInProgress);
	const videoDevice = useAppSelector((state) => state.settings.selectedVideoDevice);
	const [ selectedVideoDevice, setSelectedVideoDevice ] = useState(videoDevice);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			setSelectedVideoDevice(deviceId);

			if (!withConfirm) dispatch(settingsActions.setSelectedVideoDevice(deviceId));

			dispatch(updatePreviewWebcam({ restart: true, newDeviceId: deviceId }));
		}
	};

	const handleConfirm = (): void => {
		if (webcamProducer) dispatch(updateWebcam({ restart: true, newDeviceId: selectedVideoDevice }));
		else dispatch(settingsActions.setSelectedVideoDevice(selectedVideoDevice));

		dispatch(updatePreviewWebcam({ restart: true, newDeviceId: selectedVideoDevice }));
	};

	return (
		<>
			{ videoDevices.length > 1 &&
				<ChooserDiv>
					<DeviceChooser
						value={selectedVideoDevice ?? ''}
						setValue={handleDeviceChange}
						name={videoDeviceLabel()}
						devicesLabel={selectVideoDeviceLabel()}
						noDevicesLabel={noVideoDevicesLabel()}
						disabled={videoDevices.length < 2 || videoInProgress}
						devices={videoDevices}
					/>
					<>
						{ withConfirm && (selectedVideoDevice !== videoDevice) && (
							<Button
								variant='contained'
								onClick={handleConfirm}
								disabled={videoInProgress}
							>
								{ applyLabel() }
							</Button>
						)}
					</>
				</ChooserDiv>
			}
		</>
	);
};

export default VideoInputChooser;