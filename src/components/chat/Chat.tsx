import { styled } from '@mui/material';
import ChatHistory from './ChatHistory';

const ChatDiv = styled('div')(({ theme }) => ({
	width: '100%',
	height: '100%',
	overflowY: 'auto',
	paddingLeft: theme.spacing(1),
}));

const Chat = (): JSX.Element => {
	return (
		<ChatDiv>
			<ChatHistory />
		</ChatDiv>
	);
};

export default Chat;