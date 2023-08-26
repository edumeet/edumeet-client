import { useAppDispatch } from '../../store/hooks';
import { VolumeUp } from '@mui/icons-material';
import ControlButton from './ControlButton';
import { mediaActions } from '../../store/slices/mediaSlice';
import { testAudioOutputLabel } from '../translated/translatedComponents';

const TestAudioOutputButton = (): JSX.Element => {
	const dispatch = useAppDispatch();

	return (
		<ControlButton
			toolTip={testAudioOutputLabel()}
			onClick={() => {
				dispatch(mediaActions.testAudioOutput());
			}}
		>
			<VolumeUp />
		</ControlButton>
	);
};

export default TestAudioOutputButton;