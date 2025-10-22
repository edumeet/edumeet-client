import { styled } from '@mui/material';
import { usePermissionSelector } from '../../store/hooks';
import { permissions } from '../../utils/roles';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import ChatModerator from './ChatModerator';

const ChatDiv = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	height: '100%',
	overflowY: 'auto',
});

const Chat = (): React.JSX.Element => {
	const isChatModerator = usePermissionSelector(permissions.MODERATE_CHAT);
	const canChat = usePermissionSelector(permissions.SEND_CHAT);

	return (
		<ChatDiv>
			{ isChatModerator && <ChatModerator /> }
			<ChatHistory />
			{ canChat && <ChatInput /> }
		</ChatDiv>
	);
};

export default Chat;