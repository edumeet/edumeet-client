import { Button, Tooltip } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import { notificationsActions } from '../../store/slices/notificationsSlice';
import { testAudioOutputLabel } from '../translated/translatedComponents';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';

const TestAudioOutputButton = (): React.JSX.Element => {
	const audioDevices = useDeviceSelector('audiooutput');
	const audioInProgress = useAppSelector((state) => state.me.audioInProgress);
	const dispatch = useAppDispatch();

	const triggerTestSound = (): void => {
		dispatch(notificationsActions.playTestSound());
	};

	return (
		<>
			{ audioDevices.length > 1 &&
				<Tooltip title={ testAudioOutputLabel() }>
					<Button
						onClick={triggerTestSound}
						disabled={audioInProgress}
					>
						<AudiotrackIcon />
					</Button>
				</Tooltip>
			}
		</>
	);
};

export default TestAudioOutputButton;
