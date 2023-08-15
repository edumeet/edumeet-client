import { Button } from '@mui/material';
import { useEffect } from 'react';
import { stopPreviewMic, updateLiveMic, updatePreviewMic } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import { meProducersSelector } from '../../store/selectors';
import {
	applyLabel,
	audioDeviceLabel,
	noAudioDevicesLabel,
	selectAudioDeviceLabel
} from '../translated/translatedComponents';
import DeviceChooser, { ChooserDiv } from './DeviceChooser';

interface AudioInputChooserProps {
	withConfirm?: boolean;
}

const AudioInputChooser = ({
	withConfirm
}: AudioInputChooserProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const { micProducer } = useAppSelector(meProducersSelector);
	const audioDevices = useDeviceSelector('audioinput');
	const { audioInProgress, previewAudioDeviceId, audioMuted } = useAppSelector((state) => state.media);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			dispatch(updatePreviewMic(deviceId));
		}
	};

	const handleConfirm = (): void => {
		dispatch(updateLiveMic());
	};

	useEffect(() => {
		if (!audioMuted)
			dispatch(updatePreviewMic());

		return (): void => {
			dispatch(stopPreviewMic());
		};
	}, []);

	return (
		<ChooserDiv>
			<DeviceChooser
				value={previewAudioDeviceId ?? ''}
				setValue={handleDeviceChange}
				name={audioDeviceLabel()}
				devicesLabel={selectAudioDeviceLabel()}
				noDevicesLabel={noAudioDevicesLabel()}
				disabled={audioDevices.length === 0 || audioInProgress}
				devices={audioDevices}
			/>
			{withConfirm && micProducer && (
				<Button
					onClick={handleConfirm}
					disabled={!confirm || audioInProgress}
				>
					{applyLabel()}
				</Button>
			)}
		</ChooserDiv>
	);
};

export default AudioInputChooser;
