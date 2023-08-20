import { Button } from '@mui/material';
import { updateLiveMic, updatePreviewMic } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import {
	applyLabel,
	noAudioInputDevicesLabel,
	selectAudioInputDeviceLabel
} from '../translated/translatedComponents';
import DeviceChooser, { ChooserDiv } from './DeviceChooser';
import { mediaActions } from '../../store/slices/mediaSlice';

interface AudioInputChooserProps {
	withConfirm?: boolean;
}

const AudioInputChooser = ({
	withConfirm
}: AudioInputChooserProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const audioDevices = useDeviceSelector('audioinput');
	const { audioInProgress, previewAudioInputDeviceId } = useAppSelector((state) => state.media);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			dispatch(updatePreviewMic(deviceId));
		}
	};

	const handleConfirm = (): void => {
		dispatch(mediaActions.setLiveAudioInputDeviceId(previewAudioInputDeviceId));
		dispatch(mediaActions.setAudioMuted(false));
		dispatch(updateLiveMic());
	};

	return (
		<ChooserDiv>
			<DeviceChooser
				value={previewAudioInputDeviceId ?? ''}
				setValue={handleDeviceChange}
				devicesLabel={selectAudioInputDeviceLabel()}
				noDevicesLabel={noAudioInputDevicesLabel()}
				disabled={audioDevices.length === 0 || audioInProgress}
				devices={audioDevices}
			/>
			{withConfirm && (
				<Button
					onClick={handleConfirm}
					disabled={audioInProgress}
				>
					{applyLabel()}
				</Button>
			)}
		</ChooserDiv>
	);
};

export default AudioInputChooser;
