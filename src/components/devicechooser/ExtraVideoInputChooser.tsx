import { useState } from 'react';
import {
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import {
	noVideoDevicesLabel,
	selectVideoDeviceLabel,
} from '../translated/translatedComponents';
import DeviceChooser, { ChooserDiv } from './DeviceChooser';

interface VideoInputChooserProps {
	// eslint-disable-next-line no-unused-vars
	onDeviceChange?: (deviceId: string) => void;
}

const ExtraVideoInputChooser = ({
	onDeviceChange,
}: VideoInputChooserProps): JSX.Element => {
	const { videoInProgress, liveVideoDeviceId } = useAppSelector((state) => state.media);
	const videoDevices = useDeviceSelector('videoinput', liveVideoDeviceId);
	const [ videoDevice, setVideoDevice ] = useState<string>('');

	const handleDeviceChange = (deviceId: string): void => {
		setVideoDevice(deviceId);
		onDeviceChange?.(deviceId);
	};

	return (
		<ChooserDiv>
			<DeviceChooser
				value={videoDevice}
				setValue={handleDeviceChange}
				devicesLabel={selectVideoDeviceLabel()}
				noDevicesLabel={noVideoDevicesLabel()}
				disabled={videoDevices.length === 0 || videoInProgress}
				devices={videoDevices}
			/>
		</ChooserDiv>
	);
};

export default ExtraVideoInputChooser;