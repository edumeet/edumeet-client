import { Button } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import {
	applyLabel,
	noAudioOutputDevicesLabel,
	selectAudioOutputDeviceLabel,
	tryToLoadAudioDevices
} from '../translated/translatedComponents';
import DeviceChooser, { ChooserDiv } from './DeviceChooser';
import { mediaActions } from '../../store/slices/mediaSlice';
import { getUserMedia } from '../../store/actions/mediaActions';

interface AudioInputChooserProps {
	withConfirm?: boolean;
}

const dummyDevice = {
	kind: 'audiooutput',
	label: tryToLoadAudioDevices(),
	deviceId: 'TRY_TO_LOAD_AUDIO_DEVICES'
} as MediaDeviceInfo;

const AudioOutputChooser = ({
	withConfirm
}: AudioInputChooserProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const audioDevices = useDeviceSelector('audiooutput');
	const hasDevices = audioDevices.length > 0;
	const { audioInProgress, previewAudioOutputDeviceId } = useAppSelector((state) => state.media);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId === dummyDevice.deviceId) {
			dispatch(getUserMedia('audio'));
			
			return;
		}
		if (deviceId) {
			dispatch(mediaActions.setPreviewAudioOutputDeviceId(deviceId));
		}
	};

	const handleConfirm = (): void => {
		dispatch(mediaActions.setLiveAudioOutputDeviceId(previewAudioOutputDeviceId));
	};

	return (
		<ChooserDiv>
			<DeviceChooser
				value={previewAudioOutputDeviceId ?? hasDevices ? audioDevices[0].deviceId : ''}
				setValue={handleDeviceChange}
				devicesLabel={hasDevices ? selectAudioOutputDeviceLabel() : noAudioOutputDevicesLabel()}
				noDevicesLabel={noAudioOutputDevicesLabel()}
				disabled={audioInProgress}
				devices={hasDevices ? audioDevices : [ dummyDevice ]}
			/>
			<Button onClick={() => dispatch(mediaActions.testAudioOutput())}>
				test
			</Button>
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

export default AudioOutputChooser;
