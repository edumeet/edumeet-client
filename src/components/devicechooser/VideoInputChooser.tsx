import { useEffect, useState } from 'react';
import { updatePreviewWebcam, updateWebcam } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import {
	noVideoDevicesLabel,
	selectVideoDeviceLabel,
	videoDeviceLabel
} from '../translated/translatedComponents';
import DeviceChooser, { ApplyButton, ChooserDiv } from './DeviceChooser';
import { settingsActions } from '../../store/slices/settingsSlice';
import { BlurButton, VideoBackgroundButton } from '../settingsdialog/SettingsSwitches';

interface VideoInputChooserProps {
	withBlur?: boolean;
	withConfirm?: boolean;
	withVideoBackground?: boolean;
}

const VideoInputChooser = ({
	withBlur,
	withConfirm,
	withVideoBackground,
}: VideoInputChooserProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const webcamEnabled = useAppSelector((state) => state.me.webcamEnabled);
	const videoDevices = useDeviceSelector('videoinput');
	const videoInProgress = useAppSelector((state) => state.me.videoInProgress);
	const videoDevice = useAppSelector((state) => state.settings.selectedVideoDevice);
	const [ selectedVideoDevice, setSelectedVideoDevice ] = useState(videoDevice);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			setSelectedVideoDevice(deviceId);

			if (!withConfirm) dispatch(settingsActions.setSelectedVideoDevice(deviceId));

			dispatch(updatePreviewWebcam({ newDeviceId: deviceId }));
		}
	};

	const handleConfirm = (): void => {
		if (webcamEnabled) {
			dispatch(updateWebcam({ newDeviceId: selectedVideoDevice }));
		} else {
			dispatch(settingsActions.setSelectedVideoDevice(selectedVideoDevice));
		}
	};

	useEffect(() => {
		if (!withConfirm) setSelectedVideoDevice(videoDevice);
	}, [ videoDevice ]);

	return (
		<ChooserDiv>
			<DeviceChooser
				value={selectedVideoDevice ?? ''}
				setValue={handleDeviceChange}
				name={videoDeviceLabel()}
				devicesLabel={selectVideoDeviceLabel()}
				noDevicesLabel={noVideoDevicesLabel()}
				disabled={videoDevices.length < 2 || videoInProgress}
				devices={videoDevices}
				extraButtons={<>
					{ withBlur && <BlurButton disabled={videoDevices.length === 0 || videoInProgress} /> }
					{ withVideoBackground && <VideoBackgroundButton disabled={videoDevices.length === 0 || videoInProgress} /> }
					{ withConfirm && (selectedVideoDevice !== videoDevice) && (
						<ApplyButton
							onClick={handleConfirm}
							disabled={videoInProgress}
						/>
					)}
				</>}
			/>
		</ChooserDiv>
	);
};

export default VideoInputChooser;
