import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector,
} from '../../store/hooks';
import { MediaState } from '../../utils/types';
import {
	activateAudioLabel,
	audioUnsupportedLabel,
	muteAudioLabel,
	unmuteAudioLabel
} from '../translated/translatedComponents';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { pauseMic, resumeMic, updateMic } from '../../store/actions/mediaActions';
import { permissions } from '../../utils/roles';

const MicButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const audioMuted = useAppSelector((state) => state.me.audioMuted);
	const hasAudioPermission = usePermissionSelector(permissions.SHARE_AUDIO);
	const { canSendMic, audioInProgress } = useAppSelector((state) => state.me);

	let micState: MediaState, micTip;

	if (!canSendMic || !hasAudioPermission) {
		micState = 'unsupported';
		micTip = audioUnsupportedLabel();
	} else if (micEnabled && !audioMuted) {
		micState = 'on';
		micTip = muteAudioLabel();
	} else if (micEnabled && audioMuted) {
		micState = 'muted';
		micTip = unmuteAudioLabel();
	} else {
		micState = 'off';
		micTip = activateAudioLabel();
	}

	return (
		<ControlButton
			toolTip={micTip}
			onClick={() => {
				if (micState === 'unsupported') return;

				if (micState === 'off') {
					dispatch(updateMic());
				} else if (micState === 'muted') {
					dispatch(resumeMic());
				} else {
					dispatch(pauseMic());
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
