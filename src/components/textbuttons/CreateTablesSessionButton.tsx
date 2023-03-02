import { Button } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
// import { createTablesSession } from '../../store/actions/chatActions';
import { clearChat } from '../../store/actions/chatActions';
import { chatActions } from '../../store/slices/chatSlice';

import {
	createTablesSessionLabel,
} from '../translated/translatedComponents';

const CreateTablesSessionButton = (): JSX.Element => {
	const dispatch = useAppDispatch();

	const handleCreateTablesSession = (): void => {
		dispatch(chatActions.clearChat());
		
		// dispatch(clearChat());
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

export default CreateTablesSessionButton;