import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { MediaState } from '../../utils/types';
import {
	activateAudioLabel,
	muteAudioLabel,
} from '../translated/translatedComponents';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { updatePreviewMic, stopPreviewMic } from '../../store/actions/mediaActions';
import { meActions } from '../../store/slices/meSlice';

const MicPreviewButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const audioDevice = useAppSelector((state) => state.settings.selectedAudioDevice);

	const {
		previewMicTrackId,
		audioInProgress,
	} = useAppSelector((state) => state.me);

	let micState: MediaState, micTip;

	if (previewMicTrackId) {
		micState = 'on';
		micTip = muteAudioLabel();
	} else {
		micState = 'off';
		micTip = activateAudioLabel();
	}

	return (
		<ControlButton
			toolTip={micTip}
			onClick={() => {
				if (micState === 'off') {
					dispatch(updatePreviewMic({ newDeviceId: audioDevice }));
					dispatch(meActions.setAudioMuted(false));
				} else if (previewMicTrackId) {
					dispatch(stopPreviewMic());
					dispatch(meActions.setAudioMuted(true));
				} else {
					// Shouldn't happen
				}
			}}
			disabled={audioInProgress}
			on={micState === 'on'}
			{ ...props }
		>
			{ micState === 'on' ? <MicIcon /> : <MicOffIcon /> }
		</ControlButton>
	);
};

export default MicPreviewButton;