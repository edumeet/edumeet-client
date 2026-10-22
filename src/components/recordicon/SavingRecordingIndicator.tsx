import { CircularProgress, styled } from '@mui/material';
import IndicatorTooltip from '../indicatortooltip/IndicatorTooltip';
import { useAppSelector } from '../../store/hooks';
import { savingRecordingLabel } from '../translated/translatedComponents';

const StyledProgress = styled(CircularProgress)(({ theme }) => ({
	color: theme.appBarIconColor
}));

const SavingRecordingIndicator = (): React.JSX.Element | null => {
	const savingRecording = useAppSelector((state) => state.room.savingRecording);
	const progress = useAppSelector((state) => state.room.savingProgress);

	if (!savingRecording) return null;

	const label = progress ? `${savingRecordingLabel()} ${progress}%` : savingRecordingLabel();

	return (
		<IndicatorTooltip title={label}>
			<StyledProgress
				size={20}
				variant={progress ? 'determinate' : 'indeterminate'}
				value={progress}
			/>
		</IndicatorTooltip>
	);
};

export default SavingRecordingIndicator;
