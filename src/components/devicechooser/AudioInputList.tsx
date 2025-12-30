import { useEffect, useState } from 'react';
import { updateMic, updatePreviewMic } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector,
} from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import { MenuItem, MenuList } from '@mui/material';

const AudioInputList = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const audioDevices = useDeviceSelector('audioinput');
	const audioDevice = useAppSelector((state) => state.settings.selectedAudioDevice);
	const [ selectedAudioDevice, setSelectedAudioDevice ] = useState(audioDevice);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			setSelectedAudioDevice(deviceId);
			dispatch(settingsActions.setSelectedAudioDevice(deviceId));
			dispatch(updateMic({ newDeviceId: deviceId }));
			dispatch(updatePreviewMic({ newDeviceId: deviceId }));
		}
	};

	useEffect(() => {
		setSelectedAudioDevice(audioDevice);
	}, [ audioDevice ]);

	return (
		<>
			{ audioDevices.length > 0 &&
				<MenuList>
					{audioDevices.map((device, index) => (
						<MenuItem
							key={index}
							value={device.deviceId}
							selected={device.deviceId === selectedAudioDevice}
							onClick={() => handleDeviceChange(device.deviceId)}>
							{ device?.label ?? (index + 1) }
						</MenuItem>
					))}
				</MenuList>
			}
		</>
	);
};

export default AudioInputList;
