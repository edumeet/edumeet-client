import { Button } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { tablesActions } from '../../store/slices/tablesSlice';

import {
	createTablesSessionLabel,
} from '../translated/translatedComponents';

const CreateTablesSessionButton = (): JSX.Element => {
	const dispatch = useAppDispatch();

	const handleCreateTablesSession = (): void => {
		dispatch(tablesActions.createTablesSession());
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