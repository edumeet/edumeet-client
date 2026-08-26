import { CircularProgress, Tooltip } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import { savingRecordingLabel } from '../translated/translatedComponents';

const SavingRecordingIndicator = (): React.JSX.Element | null => {
	const savingRecording = useAppSelector((state) => state.room.savingRecording);

	if (!savingRecording) return null;

	return (
		<Tooltip title={savingRecordingLabel()}>
			<CircularProgress size={20} color='error' />
		</Tooltip>
	);
};

export default SavingRecordingIndicator;
