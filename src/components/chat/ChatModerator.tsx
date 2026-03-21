import { styled } from '@mui/material';
import { memo } from 'react';
import { useAppSelector } from '../../store/hooks';
import ClearChatButton from '../textbuttons/ClearChatButton';

const ModeratorDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	margin: theme.spacing(1),
	gap: theme.spacing(0.5),
	cursor: 'auto',
}));

const ChatModerator = (): React.JSX.Element => {
	useAppSelector((state) => state.settings.locale);

	return (
		<ModeratorDiv>
			<ClearChatButton />
		</ModeratorDiv>
	);
};

export default memo(ChatModerator);