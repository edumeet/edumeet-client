import { Button, Tooltip } from '@mui/material';
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
import { BlurButton, BlurSwitch } from '../settingsdialog/SettingsSwitches';
import SaveIcon from '@mui/icons-material/Save';

interface VideoInputChooserProps {
	withConfirm?: boolean;
}

const VideoInputChooser = ({
	withConfirm
}: VideoInputChooserProps): JSX.Element => {
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
							<Tooltip title={ applyLabel() }>
								<Button
									variant='contained'
									onClick={handleConfirm}
									disabled={videoInProgress}
								>
									<SaveIcon/>
								</Button>
							</Tooltip>
						)}
					</>
					<BlurButton />

				</ChooserDiv>
			}
			{ videoDevices.length == 1 &&
				<BlurSwitch />
			}
		</>
	);
};

export default VideoInputChooser;
