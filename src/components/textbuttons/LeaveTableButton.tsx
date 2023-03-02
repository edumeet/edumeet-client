import { Button } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { tablesActions } from '../../store/slices/tablesSlice';
import { leaveLabel, } from '../translated/translatedComponents';

const LeaveTableButton = (): JSX.Element => {
	const dispatch = useAppDispatch();

	const handleLeaveTable = (): void => {
		// dispatch(tablesActions.leaveTable());
	};

	return (
		<Button
			aria-label={leaveLabel()}
			color='error'
			variant='contained'
			onClick={handleLeaveTable}
		>
			{ leaveLabel() }
		</Button>
	);
};

export default LeaveTableButton;