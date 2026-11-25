import { useEffect, useState } from 'react';
import { updateMic, updatePreviewMic } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import {
	audioInputDeviceLabel,
	noAudioInputDevicesLabel,
	selectAudioInputDeviceLabel
} from '../translated/translatedComponents';
import DeviceChooser, { ApplyButton, ChooserDiv } from './DeviceChooser';
import { settingsActions } from '../../store/slices/settingsSlice';

interface AudioInputChooserProps {
	withConfirm?: boolean;
}

const AudioInputChooser = ({
	withConfirm
}: AudioInputChooserProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const audioDevices = useDeviceSelector('audioinput');
	const audioInProgress = useAppSelector((state) => state.me.audioInProgress);
	const audioDevice = useAppSelector((state) => state.settings.selectedAudioDevice);
	const previewMicTrackId = useAppSelector((state) => state.me.previewMicTrackId);
	const [ selectedAudioDevice, setSelectedAudioDevice ] = useState(audioDevice);

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			setSelectedAudioDevice(deviceId);

			if (!withConfirm) dispatch(settingsActions.setSelectedAudioDevice(deviceId));

			// On the join and lobby screens the preview is the microphone's on/off state, so a microphone that is off stays off.
			if (withConfirm || previewMicTrackId) dispatch(updatePreviewMic({ newDeviceId: deviceId }));
		}
	};

	const handleConfirm = (): void => {
		if (micEnabled) {
			dispatch(updateMic({ newDeviceId: selectedAudioDevice }));
		} else {
			dispatch(settingsActions.setSelectedAudioDevice(selectedAudioDevice));
		}
	};

	useEffect(() => {
		if (!withConfirm) setSelectedAudioDevice(audioDevice);
	}, [ audioDevice, withConfirm ]);

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
						extraButtons={<>{ withConfirm && (selectedAudioDevice !== audioDevice) && (
							<ApplyButton
								onClick={handleConfirm}
								disabled={audioInProgress}
							/>
						)}</>}
					/>
				</ChooserDiv>
			}
		</>
	);
};

export default AudioInputChooser;
