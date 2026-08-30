import { Box, styled, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector, usePermissionSelector } from '../../store/hooks';
import { permissions } from '../../utils/roles';
import { sendChat } from '../../store/actions/chatActions';
import { activeDirectMessageThreadSelector, chatMessagesSelector, currentRoomSessionSelector } from '../../store/selectors';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import ChatModerator from './ChatModerator';
import DirectChat from './DirectChat';
import ThreadList from './ThreadList';
import { chatInputLabel, roomChatLabel } from '../translated/translatedComponents';

const ChatDiv = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	height: '100%',
	overflowY: 'auto',
});

const RoomChatHeader = styled(Box)(({ theme }) => ({
	marginLeft: theme.spacing(1),
	marginRight: theme.spacing(1),
	marginTop: theme.spacing(1),
	marginBottom: theme.spacing(0.5),
	flexShrink: 0,
}));

const Chat = (): React.JSX.Element => {
	useAppSelector((state) => state.settings.locale);
	const dispatch = useAppDispatch();
	const isChatModerator = usePermissionSelector(permissions.MODERATE_CHAT);
	const canChat = usePermissionSelector(permissions.SEND_CHAT);
	const chatMessages = useAppSelector(chatMessagesSelector);
	const directChat = useAppSelector(activeDirectMessageThreadSelector);
	const roomSession = useAppSelector(currentRoomSessionSelector);
	const breakoutName = roomSession?.parent ? undefined : roomSession?.name?.trim();
	const heading = breakoutName || roomChatLabel();

	if (directChat) return <DirectChat key={directChat.peerId} thread={directChat} canChat={canChat} />;

	return (
		<ChatDiv>
			{ isChatModerator && <ChatModerator /> }
			<ThreadList />
			<RoomChatHeader>
				<Typography variant='body2' color='text.secondary' sx={{ fontWeight: 600 }}>{ heading }</Typography>
			</RoomChatHeader>
			<ChatHistory messages={chatMessages} peerActions />
			{ canChat && <ChatInput label={chatInputLabel()} onSend={(message) => dispatch(sendChat(message))} /> }
		</ChatDiv>
	);
};

export default Chat;
