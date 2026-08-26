import { CircularProgress } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import RecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	savingRecordingLabel,
	startRecordingLabel,
	stopRecordingLabel
} from '../translated/translatedComponents';
import { permissions } from '../../utils/roles';
import { startRecording, stopRecording } from '../../store/actions/recordingActions';

// Not rendered anywhere at the moment. Recording is reached through the
// Recording menu item in ControlButtonsBar, and this is the control bar
// variant kept for whenever it moves back out of the menu. Callers are
// responsible for the room.localRecordingEnabled and mobile gates, the
// same way ControlButtonsBar gates the menu item.
const RecordButton = (
	props
: ControlButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const hasRecordingPermission = usePermissionSelector(permissions.LOCAL_RECORD_ROOM);
	const canRecord = useAppSelector((state) => state.me.canRecord);
	const recording = useAppSelector((state) => state.room.recording);
	const savingRecording = useAppSelector((state) => state.room.savingRecording);
	const recordTip = savingRecording ? savingRecordingLabel() :
		recording ? stopRecordingLabel() : startRecordingLabel();

	return (
		<ControlButton
			toolTip={recordTip}
			onClick={() => {
				if (recording) { dispatch(stopRecording()); } else { dispatch(startRecording()); }
			}}
			disabled={!hasRecordingPermission || !canRecord || savingRecording}
			{ ...props }
		>
			{ savingRecording ? <CircularProgress size={20} /> :
				recording ? <StopIcon /> : <RecordIcon /> }
		</ControlButton>
	);
};

export default RecordButton;
