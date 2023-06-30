import { Button } from '@mui/material';
import { leaveLabel } from '../translated/translatedComponents';

const LeaveButton = (): JSX.Element => {

	return (
		<Button
			aria-label={leaveLabel()}
			color='error'
			variant='contained'
			onClick={() => location.replace(window.location.href.split('?')[0])}
			size='small'
		>
			{ leaveLabel() }
		</Button>
	);
};

export default LeaveButton;