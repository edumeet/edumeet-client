import { CircularProgress, MenuItem } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector,
} from '../../store/hooks';
import {
	savingRecordingLabel, startRecordingLabel, stopRecordingLabel,
} from '../translated/translatedComponents';
import RecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import { permissions } from '../../utils/roles';
import MoreActions from '../moreactions/MoreActions';
import { startRecording, stopRecording } from '../../store/actions/recordingActions';

const Recording = ({
	onClick
}: MenuItemProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const hasRecordingPermission = usePermissionSelector(permissions.LOCAL_RECORD_ROOM);
	const canRecord = useAppSelector((state) => state.me.canRecord);
	const recording = useAppSelector((state) => state.room.recording);
	const savingRecording = useAppSelector((state) => state.room.savingRecording);
	const savingProgress = useAppSelector((state) => state.room.savingProgress);
	const recordTip = savingRecording ?
		(savingProgress ? `${savingRecordingLabel()} ${savingProgress}%` : savingRecordingLabel()) :
		recording ? stopRecordingLabel() : startRecordingLabel();

	return (
		<MenuItem
			aria-label={recordTip}
			disabled={!hasRecordingPermission || !canRecord || savingRecording}
			onClick={() => {
				onClick();
				if (recording) {
					dispatch(stopRecording());
				} else {
					dispatch(startRecording());
				}

			}}
		>
			{savingRecording ? <CircularProgress
				size={20}
				variant={savingProgress ? 'determinate' : 'indeterminate'}
				value={savingProgress}
			/> :
				recording ? <StopIcon /> : <RecordIcon />}
			<MoreActions>
				{recordTip}
			</MoreActions>
		</MenuItem>
	);
};

export default Recording;
