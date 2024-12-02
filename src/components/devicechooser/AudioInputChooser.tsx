import { Button, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { updateMic, updatePreviewMic } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import {
	applyLabel,
	audioInputDeviceLabel,
	noAudioInputDevicesLabel,
	selectAudioInputDeviceLabel
} from '../translated/translatedComponents';
import DeviceChooser, { ChooserDiv } from './DeviceChooser';
import { settingsActions } from '../../store/slices/settingsSlice';
import { meActions } from '../../store/slices/meSlice';
import SaveIcon from '@mui/icons-material/Save';

interface AudioInputChooserProps {
	withConfirm?: boolean;
}

const AudioInputChooser = ({
	withConfirm
}: AudioInputChooserProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const audioDevices = useDeviceSelector('audioinput');
	const audioInProgress = useAppSelector((state) => state.me.audioInProgress);
	const audioDevice = useAppSelector((state) => state.settings.selectedAudioDevice);
	const [ selectedAudioDevice, setSelectedAudioDevice ] = useState(audioDevice);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			setSelectedAudioDevice(deviceId);

			if (!withConfirm) dispatch(settingsActions.setSelectedAudioDevice(deviceId));

			dispatch(updatePreviewMic({ newDeviceId: deviceId }));
		}
	};

	const handleConfirm = (): void => {
		if (micEnabled) {
			dispatch(meActions.setMicEnabled(false));
			dispatch(updateMic({ newDeviceId: selectedAudioDevice }));
		} else {
			dispatch(settingsActions.setSelectedAudioDevice(selectedAudioDevice));
		}

		dispatch(updatePreviewMic({ newDeviceId: selectedAudioDevice }));
	};

	useEffect(() => {
		if (!withConfirm) setSelectedAudioDevice(audioDevice);
	}, [ audioDevice ]);

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
						<Tooltip title={ applyLabel() }>
							<Button
								variant='contained'
								onClick={handleConfirm}
								disabled={audioInProgress}
							>
								<SaveIcon/>
							</Button>
						</Tooltip>
					)}
				</ChooserDiv>
			}
		</>
	);
};

export default AudioInputChooser;
