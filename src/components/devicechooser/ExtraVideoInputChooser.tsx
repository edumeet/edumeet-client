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

interface VideoInputChooserProps {
	// eslint-disable-next-line no-unused-vars
	onDeviceChange?: (deviceId: string) => void;
}

const ExtraVideoInputChooser = ({
	onDeviceChange,
}: VideoInputChooserProps): JSX.Element => {
	const videoDevices = useDeviceSelector('videoinput');
	const videoInProgress = useAppSelector((state) => state.me.videoInProgress);
	const [ videoDevice, setVideoDevice ] = useState<string | undefined>();

	const handleDeviceChange = (deviceId: string): void => {
		setVideoDevice(deviceId);
		onDeviceChange?.(deviceId);
	};

	return (
		<ChooserDiv>
			<DeviceChooser
				value={videoDevice}
				setValue={handleDeviceChange}
				name={videoDeviceLabel()}
				devicesLabel={selectVideoDeviceLabel()}
				noDevicesLabel={noVideoDevicesLabel()}
				disabled={videoDevices.length === 0 || videoInProgress}
				devices={videoDevices}
			/>
		</ChooserDiv>
	);
};

export default ExtraVideoInputChooser;