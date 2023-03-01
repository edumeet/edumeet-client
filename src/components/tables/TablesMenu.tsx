import { styled } from '@mui/material';
import CreateTablesSessionButton from '../textbuttons/CreateTablesSessionButton';
import CloseTablesSessionButton from '../textbuttons/CloseTablesSessionButton';
import {
	menuLabel,
} from '../translated/translatedComponents';

import { useAppSelector } from '../../store/hooks';

const ListUl = styled('ul')(({ theme }) => ({
	listStyleType: 'none',
	padding: theme.spacing(1),
	boxShadow: '0 2px 5px 2px rgba(0, 0, 0, 0.2)',
	backgroundColor: 'rgba(255, 255, 255, 1)'
}));

const ListHeaderLi = styled('li')({
	fontWeight: 'bolder'
});

const ListItemLi = styled('li')({
	width: '100%',
	overflow: 'hidden',
	cursor: 'pointer',
	'&:not(:last-child)': {
		borderBottom: '1px solid #CBCBCB'
	}
});

const TablesMenu = (): JSX.Element => {
	const created = useAppSelector((state) => state.tables.created);

	return (
		<ListUl>
			<ListHeaderLi>
				{ menuLabel() }
			</ListHeaderLi>
			<ListItemLi>
				{ ! created ? 
					<CreateTablesSessionButton /> : 
					<CloseTablesSessionButton />
				}
			</ListItemLi>
		</ListUl>
	);
};

export default TablesMenu;