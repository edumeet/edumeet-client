import { Button } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
	useDeviceSelector
} from '../../store/hooks';
import { notificationsActions } from '../../store/slices/notificationsSlice';
import { ChooserDiv } from '../devicechooser/DeviceChooser';
import { testAudioOutputLabel } from '../translated/translatedComponents';

const TestAudioOutputButton = (): JSX.Element => {
	const audioDevices = useDeviceSelector('audiooutput');
	const audioInProgress = useAppSelector((state) => state.me.audioInProgress);
	const dispatch = useAppDispatch();

	const triggerTestSound = (): void => {
		dispatch(notificationsActions.playTestSound());
	};

	return (
		<>
			{ audioDevices.length > 1 &&
			<ChooserDiv>
				<Button
					variant='contained'
					onClick={triggerTestSound}
					disabled={audioInProgress}
				>
					{ testAudioOutputLabel() }
				</Button></ChooserDiv>
			}
		</>
	);
};

export default TestAudioOutputButton;
