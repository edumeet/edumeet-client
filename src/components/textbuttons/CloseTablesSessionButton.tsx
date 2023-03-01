import { Button } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
// import { createTablesSession } from '../../store/actions/chatActions';
import {
	createTablesSessionLabel,
} from '../translated/translatedComponents';

const CloseTablesSessionButton = (): JSX.Element => {
	const dispatch = useAppDispatch();

	const handleCreateTablesSession = (): void => {
		// dispatch({ 'type': 'clearChat' });
	};

	return (
		<Button
			aria-label={createTablesSessionLabel()}
			color='error'
			variant='contained'
			onClick={handleCreateTablesSession}
		>
			{ createTablesSessionLabel() }
		</Button>
	);
};

export default CloseTablesSessionButton;