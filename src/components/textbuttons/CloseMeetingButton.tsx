import { Button } from '@mui/material';
import { closeMeeting } from '../../store/actions/roomActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	closeMeetingLabel,
} from '../translated/translatedComponents';

const CloseMeetingButton = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const closeMeetingInProgress =
		useAppSelector((state) => state.room.closeMeetingInProgress);

	const handleCloseMeeting = (): void => {
		dispatch(closeMeeting());
	};

	return (
		<Button
			aria-label={closeMeetingLabel()}
			color='error'
			variant='contained'
			onClick={handleCloseMeeting}
			disabled={closeMeetingInProgress}
			size='small'
		>
			{ closeMeetingLabel() }
		</Button>
	);
};

export default CloseMeetingButton;