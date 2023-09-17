import { Button } from '@mui/material';
import { leaveLabel } from '../translated/translatedComponents';
import { useAppDispatch } from '../../store/hooks';
import { leaveRoom } from '../../store/actions/roomActions';

const LeaveButton = (): React.JSX.Element => {
	const dispatch = useAppDispatch();

	const handleLeave = () => {
		dispatch(leaveRoom());
	};

	return (
		<Button
			aria-label={leaveLabel()}
			color='error'
			variant='contained'
			onClick={handleLeave} 
			size='small'
		>
			{ leaveLabel() }
		</Button>
	);
};

export default LeaveButton;