import { useIntl } from 'react-intl';
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

const MicPreviewButton = (props: ControlButtonProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();

	const {
		previewMicTrackId,
		audioInProgress,
	} = useAppSelector((state) => state.me);

	let micState: MediaState, micTip;

	if (previewMicTrackId) {
		micState = 'on';
		micTip = muteAudioLabel(intl);
	} else {
		micState = 'off';
		micTip = activateAudioLabel(intl);
	}

	return (
		<ControlButton
			toolTip={micTip}
			onClick={() => {
				if (micState === 'off') {
					dispatch(updatePreviewMic());
				} else if (previewMicTrackId) {
					dispatch(stopPreviewMic());
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