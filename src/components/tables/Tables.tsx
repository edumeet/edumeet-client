import { styled, Collapse } from '@mui/material';
// import { usePermissionSelector } from '../../store/hooks';
// import { permissions } from '../../utils/roles';
import { useAppSelector } from '../../store/hooks';
import TableMenu from './TablesMenu';
import TablesList from './TablesList';

const TableDiv = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	height: '100%',
	overflowY: 'auto',
});

const Tables = (): JSX.Element => {
	// const isChatModerator = usePermissionSelector(permissions.MODERATE_CHAT);
	const created = useAppSelector((state) => state.tables.created);
	
	return (
		<TableDiv>
			{/* { isChatModerator && <TableMenu /> } */}
			<TableMenu />
			<Collapse in={created}>
				<TablesList />
			</Collapse>
		</TableDiv>
	);
};

export default Tables;