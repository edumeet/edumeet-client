import {
	useAppDispatch, useAppSelector,
} from '../../store/hooks';
import TranscriptionIcon from '@mui/icons-material/Subtitles';
import TranscriptionOffIcon from '@mui/icons-material/SubtitlesOutlined';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { startTranscribingLabel, stopTranscribingLabel } from '../translated/translatedComponents';
import { startTranscription, stopTranscription } from '../../store/actions/mediaActions';

const TranscriptionButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const startTranscriptionInProgress = useAppSelector(
		(state) => state.room.startTranscriptionInProgress);
	const transcriptionRunning = useAppSelector(
		(state) => state.room.transcriptionRunning);
	const transcribeTip =
		transcriptionRunning ? stopTranscribingLabel : startTranscribingLabel;

	return (
		<ControlButton
			toolTip={transcribeTip()}
			onClick={() => {
				if (!transcriptionRunning)
					dispatch(startTranscription());
				else
					dispatch(stopTranscription());
			}}
			disabled={startTranscriptionInProgress}
			{ ...props }
		>
			{ transcriptionRunning ? <TranscriptionIcon /> : <TranscriptionOffIcon /> }
		</ControlButton>
	);
};

export default TranscriptionButton;