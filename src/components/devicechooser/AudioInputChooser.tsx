import { Button } from '@mui/material';
import { useState } from 'react';
import { updateMic, updatePreviewMic } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import { meProducersSelector } from '../../store/selectors';
import {
	applyLabel,
	audioInputDeviceLabel,
	noAudioInputDevicesLabel,
	selectAudioInputDeviceLabel
} from '../translated/translatedComponents';
import DeviceChooser, { ChooserDiv } from './DeviceChooser';
import { settingsActions } from '../../store/slices/settingsSlice';

interface AudioInputChooserProps {
	withConfirm?: boolean;
}

const AudioInputChooser = ({
	withConfirm
}: AudioInputChooserProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const { micProducer } = useAppSelector(meProducersSelector);
	const audioDevices = useDeviceSelector('audioinput');
	const audioInProgress = useAppSelector((state) => state.me.audioInProgress);
	const audioDevice = useAppSelector((state) => state.settings.selectedAudioDevice);
	const [ selectedAudioDevice, setSelectedAudioDevice ] = useState(audioDevice);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			setSelectedAudioDevice(deviceId);

			if (!withConfirm) dispatch(settingsActions.setSelectedAudioDevice(deviceId));

			dispatch(updatePreviewMic({ restart: true, newDeviceId: deviceId }));
		}
	};

	const handleConfirm = (): void => {
		if (micProducer) dispatch(updateMic({ restart: true, newDeviceId: selectedAudioDevice }));
		else dispatch(settingsActions.setSelectedAudioDevice(selectedAudioDevice));

		dispatch(updatePreviewMic({ restart: true, newDeviceId: selectedAudioDevice }));
	};

	return (
		<>
			{ audioDevices.length > 1 &&
				<ChooserDiv>
					<DeviceChooser
						value={selectedAudioDevice ?? ''}
						setValue={handleDeviceChange}
						name={audioInputDeviceLabel()}
						devicesLabel={selectAudioInputDeviceLabel()}
						noDevicesLabel={noAudioInputDevicesLabel()}
						disabled={audioDevices.length < 2 || audioInProgress}
						devices={audioDevices}
					/>
					{ withConfirm && (selectedAudioDevice !== audioDevice) && (
						<Button
							variant='contained'
							onClick={handleConfirm}
							disabled={audioInProgress}
						>
							{ applyLabel() }
						</Button>
					)}
				</ChooserDiv>
			}
		</>
	);
};

export default AudioInputChooser;
