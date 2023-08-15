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
import { updateLiveMic } from '../../store/actions/mediaActions';

const MicButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasAudioPermission = usePermissionSelector(permissions.SHARE_AUDIO);
	const micProducer = useAppSelector(micProducerSelector);

	const {
		canSendMic,
	} = useAppSelector((state) => state.me);

	const {	audioInProgress, liveAudioDeviceId } = useAppSelector((state) => state.media);

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
					liveAudioDeviceId && dispatch(updateLiveMic());
					// TODO: else start preview dialog
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