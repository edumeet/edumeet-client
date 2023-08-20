import { Button } from '@mui/material';
import { leaveLabel } from '../translated/translatedComponents';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { leaveRoom } from '../../store/actions/roomActions';

const LeaveButton = (): React.JSX.Element => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const handleLeave = () => {
		dispatch(leaveRoom());
		navigate('/');
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