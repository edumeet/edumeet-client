import { Button } from '@mui/material';
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

	const handleDeviceChange = (deviceId: string): void => {
		if (deviceId) {
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
		// TODO: Add replace track support
		dispatch(updateMic({
			restart: true
		}));

		setConfirm(false);
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
				value={audioDevice ?? ''}
				setValue={handleDeviceChange}
				name={audioDeviceLabel()}
				devicesLabel={selectAudioDeviceLabel()}
				noDevicesLabel={noAudioDevicesLabel()}
				disabled={audioDevices.length === 0 || audioInProgress}
				devices={audioDevices}
			/>
			{ withConfirm && micProducer && (
				<Button
					onClick={handleConfirm}
					disabled={!confirm || audioInProgress}
				>
					{ applyLabel() }
				</Button>
			)}
		</ChooserDiv>
	);
};

export default AudioInputChooser;