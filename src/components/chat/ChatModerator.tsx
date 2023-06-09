import { styled } from '@mui/material';
import { memo } from 'react';
import ClearChatButton from '../textbuttons/ClearChatButton';

const ModeratorDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	margin: theme.spacing(1),
	gap: theme.spacing(0.5),
	cursor: 'auto',
}));

const ChatModerator = (): JSX.Element => {
	return (
		<ModeratorDiv>
			<ClearChatButton />
		</ModeratorDiv>
	);
};

export default memo(ChatModerator);