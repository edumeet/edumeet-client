import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { micProducerSelector } from '../../store/selectors';
import { producersActions } from '../../store/slices/producersSlice';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import {
	audioUnsupportedLabel,
	activateAudioLabel,
	muteAudioLabel,
	unmuteAudioLabel
} from '../translated/translatedComponents';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { updateLiveMic, updatePreviewMic, updatePreviewWebcam } from '../../store/actions/mediaActions';
import { uiActions } from '../../store/slices/uiSlice';

const MicButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasAudioPermission = usePermissionSelector(permissions.SHARE_AUDIO);
	const micProducer = useAppSelector(micProducerSelector);

	const {
		canSendMic,
	} = useAppSelector((state) => state.me);

	const {	audioInProgress, liveAudioInputDeviceId } = useAppSelector((state) => state.media);
	const { settingsOpen } = useAppSelector((state) => state.ui);

	let micState: MediaState, micTip;

	if (!canSendMic || !hasAudioPermission) {
		micState = 'unsupported';
		micTip = audioUnsupportedLabel();
	} else if (!micProducer) {
		micState = 'off';
		micTip = activateAudioLabel();
	} else if (!micProducer.paused) {
		micState = 'on';
		micTip = muteAudioLabel();
	} else {
		micState = 'muted';
		micTip = unmuteAudioLabel();
	}

	return (
		<ControlButton
			toolTip={micTip}
			onClick={() => {
				if (micState === 'unsupported') return;

				if (micState === 'off') {
					if (liveAudioInputDeviceId) {
						dispatch(updateLiveMic());
					} else {
						dispatch(updatePreviewMic());
						dispatch(updatePreviewWebcam());
						dispatch(uiActions.setUi({ settingsOpen: !settingsOpen })); 
					}
				} else if (micProducer) {
					if (micState === 'on') {
						dispatch(
							producersActions.setProducerPaused({
								producerId: micProducer.id,
								local: true,
								source: 'mic'
							})
						);
					} else if (micState === 'muted') {
						dispatch(
							producersActions.setProducerResumed({
								producerId: micProducer.id,
								local: true,
								source: 'mic'
							})
						);
					}
				} else {
					// Shouldn't happen
				}
			}}
			disabled={micState === 'unsupported' || audioInProgress}
			on={micState === 'on'}
			{ ...props }
		>
			{ micState === 'on' ? <MicIcon /> : <MicOffIcon /> }
		</ControlButton>
	);
};

export default MicButton;