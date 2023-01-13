import { styled } from '@mui/material';
import { memo } from 'react';
import ClearFilesharingButton from '../textbuttons/ClearFilesharingButton';
import { moderatorActionsLabel } from '../translated/translatedComponents';

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

const FilesharingModerator = (): JSX.Element => {
	return (
		<ListUl>
			<ListHeaderLi>
				{ moderatorActionsLabel()}
			</ListHeaderLi>
			<ListItemLi>
				<ClearFilesharingButton />
			</ListItemLi>
		</ListUl>
	);
};

export default memo(FilesharingModerator);