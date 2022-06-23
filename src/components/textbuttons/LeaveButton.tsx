import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { leaveLabel, LeaveMessage } from '../translated/translatedComponents';

const LeaveButton = (): JSX.Element => {
	const navigate = useNavigate();

	return (
		<Button
			aria-label={leaveLabel()}
			color='error'
			variant='contained'
			onClick={() => navigate('/')}
		>
			<LeaveMessage />
		</Button>
	);
};

export default LeaveButton;