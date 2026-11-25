import { updateMic } from '../../store/actions/mediaActions';
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
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const audioInProgress = useAppSelector((state) => state.me.audioInProgress);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			if (micEnabled) dispatch(updateMic({ newDeviceId: deviceId }));
			else dispatch(settingsActions.setSelectedAudioDevice(deviceId));
		}
	};

	return (
		<>
			{ audioDevices.length > 0 &&
				<MenuList>
					{audioDevices.map((device, index) => (
						<MenuItem
							key={index}
							value={device.deviceId}
							selected={device.deviceId === audioDevice}
							disabled={audioInProgress}
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
