import { MenuItem } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import {
	audioUnsupportedLabel,
	unmuteAudioLabel,
} from '../translated/translatedComponents';
import AddVideoIcon from '@mui/icons-material/VideoCall';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import { MediaState } from '../../utils/types';
import MoreActions from '../moreactions/MoreActions';
import { uiActions } from '../../store/slices/uiSlice';

const ExtraAudio = ({
	onClick
}: MenuItemProps): JSX.Element => {
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
		<MenuItem
			aria-label={audioTip}
			disabled={audioState === 'unsupported' || audioInProgress}
			onClick={() => {
				onClick();

				if (audioState === 'unsupported') return;

				if (audioState === 'off') {
					dispatch(uiActions.setUi({ extraAudioDialogOpen: true }));
				} else {
					// Shouldn't happen
				}
			}}
		>
			<AddVideoIcon />
			<MoreActions>
				{ audioTip }
			</MoreActions>
		</MenuItem>
	);
};

export default ExtraAudio;