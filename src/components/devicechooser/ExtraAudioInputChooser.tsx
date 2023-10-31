import { useState } from 'react';
import {
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import {
	noVideoDevicesLabel,
	selectVideoDeviceLabel,
	videoDeviceLabel
} from '../translated/translatedComponents';
import DeviceChooser, { ChooserDiv } from './DeviceChooser';

interface AudioInputChooserProps {
	// eslint-disable-next-line no-unused-vars
	onDeviceChange?: (deviceId: string) => void;
}

const ExtraAudioInputChooser = ({
	onDeviceChange,
}: AudioInputChooserProps): JSX.Element => {
	const selectedAudioDevice = useAppSelector((state) => state.settings.selectedAudioDevice);
	const audioDevices = useDeviceSelector('audioinput', selectedAudioDevice);
	const audioInProgress = useAppSelector((state) => state.me.audioInProgress);
	const [ audioDevice, setAudioDevice ] = useState<string>('');

	const handleDeviceChange = (deviceId: string): void => {
		setAudioDevice(deviceId);
		onDeviceChange?.(deviceId);
	};

	return (
		<ChooserDiv>
			<DeviceChooser
				value={audioDevice}
				setValue={handleDeviceChange}
				name={videoDeviceLabel()}
				devicesLabel={selectVideoDeviceLabel()}
				noDevicesLabel={noVideoDevicesLabel()}
				disabled={audioDevices.length === 0 || audioInProgress}
				devices={audioDevices}
			/>
		</ChooserDiv>
	);
};

export default ExtraAudioInputChooser;