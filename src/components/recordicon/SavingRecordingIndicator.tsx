import { CircularProgress, Tooltip } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import { savingRecordingLabel } from '../translated/translatedComponents';

const SavingRecordingIndicator = (): React.JSX.Element | null => {
	const savingRecording = useAppSelector((state) => state.room.savingRecording);
	const progress = useAppSelector((state) => state.room.savingProgress);

	if (!savingRecording) return null;

	const label = progress ? `${savingRecordingLabel()} ${progress}%` : savingRecordingLabel();

	return (
		<Tooltip title={label}>
			<CircularProgress
				size={20}
				color='error'
				variant={progress ? 'determinate' : 'indeterminate'}
				value={progress}
			/>
		</Tooltip>
	);
};

export default SavingRecordingIndicator;
