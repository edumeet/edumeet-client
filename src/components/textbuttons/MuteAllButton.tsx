import { Button } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	muteAllLabel,
	MuteAllMessage
} from '../translated/translatedComponents';
import { muteAll } from '../../store/actions/peerActions';

const MuteAllButton = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const muteAllInProgress = useAppSelector((state) => state.room.muteAllInProgress);

	const handleMuteAll = (): void => {
		dispatch(muteAll());
	};

	return (
		<Button
			aria-label={muteAllLabel()}
			color='error'
			variant='contained'
			onClick={handleMuteAll}
			disabled={muteAllInProgress}
		>
			<MuteAllMessage />
		</Button>
	);
};

export default MuteAllButton;