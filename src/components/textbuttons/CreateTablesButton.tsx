import { Button } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { tablesActions } from '../../store/slices/tablesSlice';

import {
	createTablesLabel,
} from '../translated/translatedComponents';

const CreateTablesButton = (): JSX.Element => {
	const dispatch = useAppDispatch();

	const handleCreateTables = (): void => {
		dispatch(tablesActions.createTables());
	};

	return (
		<Button
			aria-label={createTablesLabel()}
			color='error'
			variant='contained'
			onClick={handleCreateTables}
		>
			{ createTablesLabel() }
		</Button>
	);
};

export default CreateTablesButton;