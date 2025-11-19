import { Button } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	muteAllLabel,
} from '../translated/translatedComponents';
import { muteAll } from '../../store/actions/peerActions';

const MuteAllButton = (): React.JSX.Element => {
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
			size='small'
		>
			{ muteAllLabel() }
		</Button>
	);
};

export default MuteAllButton;