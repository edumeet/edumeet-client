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
import { recordingActions } from '../../store/slices/recordingSlice';

const RecordButton = (
	props
: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasRecordingPermission = usePermissionSelector(permissions.LOCAL_RECORD_ROOM);
	const recording = useAppSelector((state) => state.recording.recording);

	return (
		<ControlButton
			toolTip={recording ? stopRecordingLabel() : startRecordingLabel() }
			onClick={() => {
				recording ?
					dispatch(recordingActions.stop()) :
					dispatch(recordingActions.start());
			}}
			disabled={!hasRecordingPermission}
			{ ...props }
		>
			{ recording ? <StopIcon /> : <RecordIcon /> }
		</ControlButton>
	);
};

export default RecordButton;