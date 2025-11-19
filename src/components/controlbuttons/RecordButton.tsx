import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import RecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	startRecordingLabel,
	stopRecordingLabel
} from '../translated/translatedComponents';
import { permissions } from '../../utils/roles';
import { startRecording, stopRecording } from '../../store/actions/recordingActions';

const RecordButton = (
	props
: ControlButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const hasRecordingPermission = usePermissionSelector(permissions.LOCAL_RECORD_ROOM);
	const recording = useAppSelector((state) => state.room.recording);

	return (
		<ControlButton
			toolTip={recording ? stopRecordingLabel() : startRecordingLabel() }
			onClick={() => {
				if (recording) { dispatch(stopRecording()); } else { dispatch(startRecording()); }
			}}
			disabled={!hasRecordingPermission}
			{ ...props }
		>
			{ recording ? <StopIcon /> : <RecordIcon /> }
		</ControlButton>
	);
};

export default RecordButton;
