import { useEffect, useState } from 'react';
import { updatePreviewWebcam, updateWebcam } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector,
} from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import { MenuItem, MenuList } from '@mui/material';
import { meActions } from '../../store/slices/meSlice';

const VideoInputList = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const videoDevice = useAppSelector((state) => state.settings.selectedVideoDevice);
	const videoDevices = useDeviceSelector('videoinput');
	const webcamEnabled = useAppSelector((state) => state.me.webcamEnabled);
	const [ selectedVideoDevice, setSelectedVideoDevice ] = useState(videoDevice);

	const handleDeviceChange = async (deviceId: string): Promise<void> => {
		if (deviceId) {
			setSelectedVideoDevice(deviceId);
			if (webcamEnabled) {
				dispatch(meActions.setWebcamEnabled(false));
				await dispatch(updateWebcam({ newDeviceId: deviceId }));
			}
			dispatch(settingsActions.setSelectedVideoDevice(deviceId));
			await dispatch(updatePreviewWebcam({ newDeviceId: deviceId }));
		}
	};

	useEffect(() => {
		setSelectedVideoDevice(videoDevice);
	}, [ videoDevice ]);

	return (
		<>
			{ videoDevices.length > 1 &&
					<MenuList>
						{videoDevices.map((device, index) => (
							<MenuItem
								key={index}
								value={device.deviceId}
								selected={device.deviceId === selectedVideoDevice}
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
