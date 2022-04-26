import { Button, styled } from '@mui/material';
import { useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { ChatMessage } from '../../utils/types';
import ScrollingList from '../scrollinglist/ScrollingList';
import { ChatScrollToBottomMessage } from '../translated/translatedComponents';

const ScrollToBottom = styled(Button)(({ theme }) => ({
	marginLeft: theme.spacing(4),
	marginRight: theme.spacing(4),
	marginBottom: theme.spacing(1),
}));

const ChatHistory = (): JSX.Element => {
	const chatHistoryRef = useRef<ScrollingList>(null);
	const chatMessages = useAppSelector((state) => state.chat);
	const [ atBottom, setAtBottom ] = useState(true);

	return (
		<>
			<ScrollingList
				ref={chatHistoryRef}
				onScroll={(isAtBottom: boolean) => {
					setAtBottom(isAtBottom);
				}}
			>
				{ chatMessages.map((message: ChatMessage, i: number) =>
					<div key={i}>{message.text}</div>
				)}
			</ScrollingList>
			{ !atBottom &&
				<ScrollToBottom
					variant='contained'
					onClick={() => chatHistoryRef.current?.scrollToBottom()}
				>
					<ChatScrollToBottomMessage />
				</ScrollToBottom>
			}
		</>
	);
};

export default ChatHistory;