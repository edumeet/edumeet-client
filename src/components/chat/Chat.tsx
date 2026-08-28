import { styled } from '@mui/material';
import { useAppDispatch, useAppSelector, usePermissionSelector } from '../../store/hooks';
import { permissions } from '../../utils/roles';
import { sendChat } from '../../store/actions/chatActions';
import { activeDirectMessageThreadSelector, chatMessagesSelector } from '../../store/selectors';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import ChatModerator from './ChatModerator';
import DirectChat from './DirectChat';
import ThreadList from './ThreadList';
import { chatInputLabel } from '../translated/translatedComponents';

const ChatDiv = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	height: '100%',
	overflowY: 'auto',
});

const Chat = (): React.JSX.Element => {
	useAppSelector((state) => state.settings.locale);
	const dispatch = useAppDispatch();
	const isChatModerator = usePermissionSelector(permissions.MODERATE_CHAT);
	const canChat = usePermissionSelector(permissions.SEND_CHAT);
	const chatMessages = useAppSelector(chatMessagesSelector);
	const directChat = useAppSelector(activeDirectMessageThreadSelector);

	if (directChat) return <DirectChat key={directChat.peerId} thread={directChat} canChat={canChat} />;

	return (
		<ChatDiv>
			{ isChatModerator && <ChatModerator /> }
			<ThreadList />
			<ChatHistory messages={chatMessages} peerActions />
			{ canChat && <ChatInput label={chatInputLabel()} onSend={(message) => dispatch(sendChat(message))} /> }
		</ChatDiv>
	);
};

export default Chat;
