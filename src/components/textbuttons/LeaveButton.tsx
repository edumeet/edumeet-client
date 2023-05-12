import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { leaveLabel } from '../translated/translatedComponents';

const LeaveButton = (): JSX.Element => {
	const navigate = useNavigate();

	return (
		<Button
			aria-label={leaveLabel()}
			color='error'
			variant='contained'
			onClick={() => navigate('/')}
			size='small'
		>
			{ leaveLabel() }
		</Button>
	);
};

export default LeaveButton;