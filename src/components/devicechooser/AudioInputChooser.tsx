import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useEffect, useState } from 'react';
import { stopPreviewMic, updateMic, updatePreviewMic } from '../../store/actions/mediaActions';
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
	preview?: boolean;
	withConfirm?: boolean;
}

const AudioInputChooser = ({
	preview,
	withConfirm
}: AudioInputChooserProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const [ confirm, setConfirm ] = useState(false);
	const { micProducer } = useAppSelector(meProducersSelector);
	const audioDevices = useDeviceSelector('audioinput');
	const audioInProgress = useAppSelector((state) => state.me.audioInProgress);
	const audioDevice = useAppSelector((state) => state.settings.selectedAudioDevice);
	const [ selectedAudioDevice, setSelectedAudioDevice ] = useState(audioDevice);
	const [ appliedAudioDevice, setAppliedAudioDevice ] = useState('');

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
			setAppliedAudioDevice(deviceId); // Update applied audio device only when the user clicks "Apply"

			if (preview) {
				setConfirm(true);
				dispatch(updatePreviewMic({
					restart: true,
					newDeviceId: deviceId,
					updateMute: !withConfirm
				}));
			} else {
				dispatch(updateMic({
					restart: true,
					newDeviceId: deviceId
				}));
			}
		}
	};

	const handleConfirm = (): void => {
		setSelectedAudioDevice(appliedAudioDevice);
		dispatch(updateMic({
			restart: true
		}));
		setConfirm(false);
	};

	const handleClose = (): void => {
		setConfirm(false);
		if (selectedAudioDevice !== audioDevice) {
			// Revert to the actual active audio device
			dispatch(updateMic({
				restart: true,
				newDeviceId: selectedAudioDevice
			}));
		}
	};

	useEffect(() => {
		if (withConfirm) {
			dispatch(updatePreviewMic({
				restart: true,
				updateMute: !withConfirm
			}));
		}

		return (): void => {
			if (withConfirm) {
				dispatch(stopPreviewMic({
					updateMute: !withConfirm
				}));
			}
		};
	}, []);

	return (
		<ChooserDiv>
			<DeviceChooser
				value={selectedAudioDevice ?? ''}
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
			<Dialog open={confirm} onClose={handleClose}>
				<DialogTitle>{applyLabel()}</DialogTitle>
				<DialogContent>
					<p>
						You have selected a new audio source but not applied it. Do you want to exit without applying?
					</p>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button onClick={handleConfirm} autoFocus>
						{applyLabel()}
					</Button>
				</DialogActions>
			</Dialog>
		</ChooserDiv>
	);
};

export default AudioInputChooser;
