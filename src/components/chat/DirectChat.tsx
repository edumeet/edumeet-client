import { Box, IconButton, styled, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { sendDirectChat } from '../../store/actions/chatActions';
import { directMessagesActions, DirectMessageThread } from '../../store/slices/directMessagesSlice';
import { uiActions } from '../../store/slices/uiSlice';
import ChatHistory from './ChatHistory';
import { directChatBackground } from './directChatTint';
import ChatInput from './ChatInput';
import {
	backToRoomChatLabel,
	peerLeftMeetingLabel,
	privateChatInputLabel
} from '../translated/translatedComponents';

const DirectChatDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	height: '100%',
	overflowY: 'auto',
	backgroundColor: directChatBackground(theme),
}));

const HeaderDiv = styled(Box)(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	gap: theme.spacing(0.5),
	padding: theme.spacing(0.5),
	flexShrink: 0,
}));

const StatusTypography = styled(Typography)(({ theme }) => ({
	textAlign: 'center',
	padding: theme.spacing(1),
}));

interface DirectChatProps {
	thread: DirectMessageThread;
	canChat: boolean;
}

const DirectChat = ({ thread, canChat }: DirectChatProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const displayName = thread.displayName ?? '';

	useEffect(() => {
		if (thread.unread) dispatch(directMessagesActions.markThreadRead(thread.peerId));
	}, [ thread.peerId, thread.unread ]);

	return (
		<DirectChatDiv>
			<HeaderDiv>
				<IconButton
					aria-label={backToRoomChatLabel()}
					size='small'
					onClick={() => dispatch(uiActions.setUi({ activeChatThread: null }))}
				>
					<ArrowBackIcon fontSize='small' />
				</IconButton>
				<Typography variant='body2' sx={{ flexGrow: 1 }}><b>{ displayName }</b></Typography>
			</HeaderDiv>
			<ChatHistory messages={thread.messages} />
			{ thread.peerGone ?
				<StatusTypography variant='caption' color='text.disabled'>
					{ peerLeftMeetingLabel(displayName) }
				</StatusTypography>
				:
				canChat && <ChatInput
					label={privateChatInputLabel(displayName)}
					onSend={(message) => dispatch(sendDirectChat(thread.peerId, message))}
				/>
			}
		</DirectChatDiv>
	);
};

export default DirectChat;
