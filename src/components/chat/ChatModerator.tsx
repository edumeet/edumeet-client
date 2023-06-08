import { styled } from '@mui/material';
import { memo } from 'react';
import ClearChatButton from '../textbuttons/ClearChatButton';

const ListUl = styled('ul')(({ theme }) => ({
	listStyleType: 'none',
	padding: theme.spacing(1),
	boxShadow: '0 2px 5px 2px rgba(0, 0, 0, 0.2)',
	backgroundColor: 'rgba(255, 255, 255, 1)',
	margin: 0,
}));

const ListItemLi = styled('li')({
	width: '100%',
	overflow: 'hidden',
	cursor: 'pointer',
	'&:not(:last-child)': {
		borderBottom: '1px solid #CBCBCB'
	}
});

const ChatModerator = (): JSX.Element => {
	return (
		<ListUl>
			<ListItemLi>
				<ClearChatButton />
			</ListItemLi>
		</ListUl>
	);
};

export default memo(ChatModerator);