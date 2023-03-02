import { Button } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { tablesActions } from '../../store/slices/tablesSlice';

import {
	closeTablesSessionLabel,
} from '../translated/translatedComponents';

const CloseTablesSessionButton = (): JSX.Element => {
	const dispatch = useAppDispatch();

	const handleCloseTablesSession = (): void => {
		dispatch(tablesActions.closeTablesSession());
	};

	return (
		<Button
			aria-label={closeTablesSessionLabel()}
			color='error'
			variant='contained'
			onClick={handleCloseTablesSession}
		>
			{ closeTablesSessionLabel() }
		</Button>
	);
};

export default CloseTablesSessionButton;