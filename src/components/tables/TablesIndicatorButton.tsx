import { Button, Fade } from '@mui/material';
import { intl } from '../../utils/intlManager';
import { useAppSelector } from '../../store/hooks';
import { FormattedMessage } from 'react-intl';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useAppDispatch } from '../../store/hooks';
import { drawerActions } from '../../store/slices/drawerSlice';

const TablesIndicator = (): JSX.Element => {
	const tables = useAppSelector((state) => state.tables);
	const dispatch = useAppDispatch();

	const toggleTablesTab = () => {
		dispatch(drawerActions.setTab('tables'));
		dispatch(drawerActions.toggle());
	};

	return (
		<>
			<Fade in={tables.list.length > 0}>
				<Button
					color='error'
					variant='contained'
					// className={classes.actionButton}
					component='span'
					startIcon={<AccountTreeIcon/>}
					onClick={toggleTablesTab}
					
					aria-label={intl.formatMessage({
						id: 'room.tablesWithNumber',
						defaultMessage: 'Tables'
					})}
				>
					<FormattedMessage
						id='room.tablesWithNumber'
						defaultMessage='Tables ({count})'
						values={{
							count: tables.list.length
						}}
					/>
				</Button>
			</Fade>
		</>
		
	);
};

export default TablesIndicator;