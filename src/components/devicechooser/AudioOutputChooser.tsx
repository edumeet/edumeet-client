import { Button } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import {
	applyLabel,
	noAudioOutputDevicesLabel,
	selectAudioOutputDeviceLabel
} from '../translated/translatedComponents';
import DeviceChooser, { ChooserDiv } from './DeviceChooser';
import { mediaActions } from '../../store/slices/mediaSlice';
import { Logger } from 'edumeet-common';

const logger = new Logger('AudioOutputChooser');

interface AudioInputChooserProps {
	withConfirm?: boolean;
}

const AudioOutputChooser = ({
	withConfirm
}: AudioInputChooserProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const audioDevices = useDeviceSelector('audiooutput');
	const { audioInProgress, previewAudioOutputDeviceId } = useAppSelector((state) => state.media);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			logger.debug('output deviceId: %s', deviceId);
			dispatch(mediaActions.setPreviewAudioOutputDeviceId(deviceId));
		}
	};

	const handleConfirm = (): void => {
		dispatch(mediaActions.setLiveAudioOutputDeviceId(previewAudioOutputDeviceId));
	};

	return (
		<ChooserDiv>
			<DeviceChooser
				value={previewAudioOutputDeviceId ?? ''}
				setValue={handleDeviceChange}
				devicesLabel={selectAudioOutputDeviceLabel()}
				noDevicesLabel={noAudioOutputDevicesLabel()}
				disabled={audioDevices.length === 0 || audioInProgress}
				devices={audioDevices}
			/>
			<Button onClick={() => dispatch(mediaActions.testAudioOutput())}
				disabled={audioDevices.length === 0}>
				Test
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
