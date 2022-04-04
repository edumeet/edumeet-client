import { useIntl } from 'react-intl';
import { updatePreviewMic } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import { deviceActions } from '../../store/slices/deviceSlice';
import {
	audioDeviceLabel,
	noAudioDevicesLabel,
	selectAudioDeviceLabel
} from '../translated/translatedComponents';
import DeviceChooser from './DeviceChooser';

const AudioInputChooser = ({
	preview
}: {
	preview?: boolean
}): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();
	const audioDevices = useDeviceSelector('audioinput');
	const audioInProgress = useAppSelector((state) => state.me.audioInProgress);
	const audioDevice = useAppSelector((state) => state.settings.selectedAudioDevice);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			if (preview) {
				dispatch(updatePreviewMic({
					restart: true,
					newDeviceId: deviceId
				}));
			} else {
				dispatch(deviceActions.updateMic({
					restart: true,
					newDeviceId: deviceId
				}));
			}
		}
	};

	return (
		<DeviceChooser
			value={audioDevice}
			setValue={handleDeviceChange}
			name={audioDeviceLabel(intl)}
			devicesLabel={selectAudioDeviceLabel(intl)}
			noDevicesLabel={noAudioDevicesLabel(intl)}
			disabled={audioDevices.length === 0 || audioInProgress}
			devices={audioDevices}
		/>
	);
};

export default AudioInputChooser;