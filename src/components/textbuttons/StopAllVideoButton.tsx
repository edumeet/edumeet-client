import { Button } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	stopAllVideoLabel,
} from '../translated/translatedComponents';
import { stopAllVideo } from '../../store/actions/peerActions';

const StopAllVideoButton = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const muteAllInProgress = useAppSelector((state) => state.room.muteAllInProgress);

	const handleStopAll = (): void => {
		dispatch(stopAllVideo());
	};

	return (
		<Button
			aria-label={stopAllVideoLabel()}
			color='error'
			variant='contained'
			onClick={handleStopAll}
			disabled={muteAllInProgress}
			size='small'
		>
			{ stopAllVideoLabel() }
		</Button>
	);
};

export default StopAllVideoButton;