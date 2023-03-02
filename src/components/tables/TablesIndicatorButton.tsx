import { Button, styled, Fade } from '@mui/material';
import { useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import ScrollingList from '../scrollinglist/ScrollingList';
import { chatScrollToBottomLabel, joinLabel } from '../translated/translatedComponents';

import { Badge, Grid, Chip, Typography, useTheme, Collapse } from '@mui/material';
import LeaveTableButton from '../textbuttons/LeaveTableButton';

import { FormattedMessage } from 'react-intl';

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useAppDispatch } from '../../store/hooks';
import { drawerActions, ToolAreaTab } from '../../store/slices/drawerSlice';

const TablesIndicator = (): JSX.Element => {
	const list = useRef<ScrollingList>(null);
	const [ atBottom, setAtBottom ] = useState(true);
	const tables = useAppSelector((state) => state.tables);
	const created = useAppSelector((state) => state.tables.created);
	const drawer = useAppSelector((state) => state.drawer);
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
					// onClick={() => {
					// 	(!drawer.open || drawer.tab !=='tables') ?
					// 		openMingleRoomsTab():
					// 		closeToolArea();
					// }}
					// aria-label={intl.formatMessage({
					// 	id: 'mingleRooms.tables',
					// 	defaultMessage: 'Tables'
					// })}
				>
					<FormattedMessage
						id='tables.tablesWithNumber'
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