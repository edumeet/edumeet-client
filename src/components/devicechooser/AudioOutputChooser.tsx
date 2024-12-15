import { useState } from 'react';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector,
} from '../../store/hooks';
import DeviceChooser, { ChooserDiv } from './DeviceChooser';
import { settingsActions } from '../../store/slices/settingsSlice';
import { audioOutputDeviceLabel, noAudioOutputDevicesLabel, selectAudioOutputDeviceLabel } from '../translated/translatedComponents';
import TestAudioOutputButton from '../audiooutputtest/AudioOutputTest';

const AudioOutputChooser = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const audioDevices = useDeviceSelector('audiooutput');
	const audioInProgress = useAppSelector((state) => state.me.audioInProgress);
	const audioOutputDevice = useAppSelector(
		(state) => state.settings.selectedAudioOutputDevice
	);
	const [ selectedDevice, setSelectedDevice ] = useState(audioOutputDevice);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			setSelectedDevice(deviceId);
			dispatch(settingsActions.setSelectedAudioOutputDevice(deviceId));
		}
	};

	return (
		<>
			{audioDevices.length > 1 && (
				<ChooserDiv>
					<DeviceChooser
						value={selectedDevice ?? ''}
						setValue={handleDeviceChange}
						name={audioOutputDeviceLabel()}
						devicesLabel={selectAudioOutputDeviceLabel()}
						noDevicesLabel={noAudioOutputDevicesLabel()}
						disabled={audioDevices.length < 2 || audioInProgress}
						devices={audioDevices}
						extraButtons={<TestAudioOutputButton />						}
					/>
				</ChooserDiv>
			)}
			{audioDevices.length == 1 && (
				<TestAudioOutputButton />
			)}

		</>
	);
};

export default AudioOutputChooser;
