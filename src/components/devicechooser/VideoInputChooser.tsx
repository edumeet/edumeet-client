import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { updatePreviewWebcam, updateWebcam } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import {
	applyLabel,
	noVideoDevicesLabel,
	selectVideoDeviceLabel,
	videoDeviceLabel
} from '../translated/translatedComponents';
import DeviceChooser, { ChooserDiv } from './DeviceChooser';
import { settingsActions } from '../../store/slices/settingsSlice';
import { meActions } from '../../store/slices/meSlice';
import { BlurButton, VideoBackgroundButton } from '../settingsdialog/SettingsSwitches';

interface VideoInputChooserProps {
	withConfirm?: boolean;
	withVideoBackgroundSelect?: boolean;
}

const VideoInputChooser = ({
	withConfirm,
	withVideoBackgroundSelect,
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

	const handleConfirm = async () => {
		if (webcamEnabled) {
			dispatch(meActions.setWebcamEnabled(false));
			await dispatch(updateWebcam({ newDeviceId: selectedVideoDevice }));
		} else {
			dispatch(settingsActions.setSelectedVideoDevice(selectedVideoDevice));
		}

		await dispatch(updatePreviewWebcam({ newDeviceId: selectedVideoDevice }));
	};

	useEffect(() => {
		if (!withConfirm) setSelectedVideoDevice(videoDevice);
	}, [ videoDevice ]);

	return (
		<>
			{ videoDevices.length >= 1 && 
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
							<BlurButton />
							{ withVideoBackgroundSelect && <VideoBackgroundButton /> }
							{ withConfirm && (selectedVideoDevice !== videoDevice) && (
								<Button
									style={{ minWidth: 'fit-content' }}
									variant='text'
									onClick={handleConfirm}
									disabled={videoInProgress}
								>
									{applyLabel()}
								</Button>
								
							)}
						</>}
					/>
					
				</ChooserDiv>
			}
			
		</>
	);
};

export default VideoInputChooser;
