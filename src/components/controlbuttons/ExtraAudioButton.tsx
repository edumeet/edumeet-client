import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import { MediaState } from '../../utils/types';
import {
	audioUnsupportedLabel,
	unmuteAudioLabel,
} from '../translated/translatedComponents';
import AddVideoIcon from '@mui/icons-material/VideoCall';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { uiActions } from '../../store/slices/uiSlice';

const ExtraAudioButton = (props: ControlButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();

	const {
		canSendMic,
		audioInProgress,
	} = useAppSelector((state) => state.me);

	let audioState: MediaState, audioTip;

	if (!canSendMic) {
		audioState = 'unsupported';
		audioTip = audioUnsupportedLabel();
	} else {
		audioState = 'off';
		audioTip = unmuteAudioLabel();
	}

	return (
		<ControlButton
			toolTip={audioTip}
			onClick={() => {
				if (audioState === 'unsupported') return;

				if (audioState === 'off') {
					dispatch(uiActions.setUi({ extraAudioDialogOpen: true }));
				} else {
					// Shouldn't happen
				}
			}}
			disabled={audioState === 'unsupported' || audioInProgress}
			{ ...props }
		>
			<AddVideoIcon />
		</ControlButton>
	);
};

export default ExtraAudioButton;