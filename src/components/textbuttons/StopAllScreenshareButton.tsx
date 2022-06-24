import { Button } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	stopAllScreensharingLabel,
	StopAllScreenSharingMessage,
} from '../translated/translatedComponents';
import { stopAllScreenshare } from '../../store/actions/peerActions';

const StopAllScreenshareButton = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const muteAllInProgress = useAppSelector((state) => state.room.muteAllInProgress);

	const handleStopAll = (): void => {
		dispatch(stopAllScreenshare());
	};

	return (
		<Button
			aria-label={stopAllScreensharingLabel()}
			color='error'
			variant='contained'
			onClick={handleStopAll}
			disabled={muteAllInProgress}
		>
			<StopAllScreenSharingMessage />
		</Button>
	);
};

export default StopAllScreenshareButton;