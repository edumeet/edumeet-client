import { MenuItem } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import {
	startTranscribingLabel, stopTranscribingLabel,
} from '../translated/translatedComponents';
import TranscriptionIcon from '@mui/icons-material/Subtitles';
import TranscriptionOffIcon from '@mui/icons-material/SubtitlesOutlined';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { startTranscription, stopTranscription } from '../../store/actions/mediaActions';

const Transcription = ({
	onClick
}: MenuItemProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const startTranscriptionInProgress = useAppSelector(
		(state) => state.room.startTranscriptionInProgress);
	const transcriptionRunning = useAppSelector(
		(state) => state.room.transcriptionRunning);
	const transcribeTip =
		transcriptionRunning ? stopTranscribingLabel : startTranscribingLabel;

	return (
		<MenuItem
			aria-label={transcribeTip()}
			disabled={startTranscriptionInProgress}
			onClick={() => {
				onClick();

				if (!transcriptionRunning)
					dispatch(startTranscription());
				else
					dispatch(stopTranscription());
			}}
		>
			{ transcriptionRunning ? <TranscriptionIcon /> : <TranscriptionOffIcon /> }
			<MoreActions>
				{ transcribeTip() }
			</MoreActions>
		</MenuItem>
	);
};

export default Transcription;