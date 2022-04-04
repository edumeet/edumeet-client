import { useIntl } from 'react-intl';
import { updatePreviewWebcam } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import { deviceActions } from '../../store/slices/deviceSlice';
import {
	noVideoDevicesLabel,
	selectVideoDeviceLabel,
	videoDeviceLabel
} from '../translated/translatedComponents';
import DeviceChooser from './DeviceChooser';

const VideoInputChooser = ({
	preview
}: {
	preview?: boolean
}): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();
	const videoDevices = useDeviceSelector('videoinput');
	const videoInProgress = useAppSelector((state) => state.me.videoInProgress);
	const videoDevice = useAppSelector((state) => state.settings.selectedVideoDevice);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			if (preview) {
				dispatch(updatePreviewWebcam({
					restart: true,
					newDeviceId: deviceId
				}));
			} else {
				dispatch(deviceActions.updateWebcam({
					restart: true,
					newDeviceId: deviceId
				}));
			}
		}
	};

	return (
		<DeviceChooser
			value={videoDevice}
			setValue={handleDeviceChange}
			name={videoDeviceLabel(intl)}
			devicesLabel={selectVideoDeviceLabel(intl)}
			noDevicesLabel={noVideoDevicesLabel(intl)}
			disabled={videoDevices.length === 0 || videoInProgress}
			devices={videoDevices}
		/>
	);
};

export default VideoInputChooser;