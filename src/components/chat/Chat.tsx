import { styled } from '@mui/material';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';

const ChatDiv = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	height: '100%',
	overflowY: 'auto',
});

const Chat = (): JSX.Element => {
	return (
		<ChatDiv>
			<ChatHistory />
			<ChatInput />
		</ChatDiv>
	);
};

export default Chat;