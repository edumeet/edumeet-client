import { Button } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { tablesActions } from '../../store/slices/tablesSlice';

import {
	closeTablesLabel,
} from '../translated/translatedComponents';

const CloseTablesButton = (): JSX.Element => {
	const dispatch = useAppDispatch();

	const handleCloseTables = (): void => {
		dispatch(tablesActions.closeTables());
	};

	return (
		<Button
			aria-label={closeTablesLabel()}
			color='error'
			variant='contained'
			onClick={handleCloseTables}
		>
			{ closeTablesLabel() }
		</Button>
	);
};

export default CloseTablesButton;