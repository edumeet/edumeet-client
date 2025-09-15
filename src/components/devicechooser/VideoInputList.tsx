import { useEffect, useState } from 'react';
import { updatePreviewWebcam } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector,
} from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import { MenuItem, MenuList } from '@mui/material';

const VideoInputList = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const videoDevice = useAppSelector((state) => state.settings.selectedVideoDevice);
	const videoDevices = useDeviceSelector('videoinput');
	const [ selectedVideoDevice, setSelectedVideoDevice ] = useState(videoDevice);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			setSelectedVideoDevice(deviceId);
			dispatch(settingsActions.setSelectedVideoDevice(deviceId));
			dispatch(updatePreviewWebcam({ newDeviceId: deviceId }));
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
