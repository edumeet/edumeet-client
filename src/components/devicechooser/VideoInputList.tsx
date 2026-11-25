import { updateWebcam } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector,
} from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import { MenuItem, MenuList } from '@mui/material';

const VideoInputList = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const videoDevice = useAppSelector((state) => state.settings.selectedVideoDevice);
	const videoDevices = useDeviceSelector('videoinput');
	const webcamEnabled = useAppSelector((state) => state.me.webcamEnabled);
	const videoInProgress = useAppSelector((state) => state.me.videoInProgress);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			if (webcamEnabled) dispatch(updateWebcam({ newDeviceId: deviceId }));
			else dispatch(settingsActions.setSelectedVideoDevice(deviceId));
		}
	};

	return (
		<>
			{ videoDevices.length > 1 &&
					<MenuList>
						{videoDevices.map((device, index) => (
							<MenuItem
								key={index}
								value={device.deviceId}
								selected={device.deviceId === videoDevice}
								disabled={videoInProgress}
								onClick={() => handleDeviceChange(device.deviceId)}>
								{ device?.label ?? (index + 1) }
							</MenuItem>
						))}
					</MenuList>
			}
		</>
	);
};

export default VideoInputList;
