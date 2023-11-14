import { Button, styled } from '@mui/material';
import { Suspense, useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { ChatMessage } from '../../utils/types';
import ScrollingList from '../scrollinglist/ScrollingList';
import { chatScrollToBottomLabel } from '../translated/translatedComponents';
// import Message, { MessageFormat } from './Message';
import { chatMessagesSelector } from '../../store/selectors';
import { lazy } from 'react';
import type { MessageFormat } from './Message';

const Message = lazy(() => import('./Message'));

const ScrollToBottom = styled(Button)(({ theme }) => ({
	marginLeft: theme.spacing(4),
	marginRight: theme.spacing(4),
	marginBottom: theme.spacing(1),
}));

const ChatHistory = (): JSX.Element => {
	const chatHistoryRef = useRef<ScrollingList>(null);
	const chatMessages = useAppSelector(chatMessagesSelector);
	const [ atBottom, setAtBottom ] = useState(true);
	const meId = useAppSelector((state) => state.me.id);

	return (
		<Suspense>
			<ScrollingList
				ref={chatHistoryRef}
				onScroll={(isAtBottom: boolean) => {
					setAtBottom(isAtBottom);
				}}
			>
				{ chatMessages.map((message: ChatMessage, i: number) => {
					const curr = message.peerId;
					const prev = chatMessages[i - 1]?.peerId;
					const next = chatMessages[i + 1]?.peerId;

					let format: MessageFormat = 'single';

					if (curr !== prev && curr === next)
						format = 'combinedBegin';
					else if (curr === prev && curr === next)
						format = 'combinedMiddle';
					else if (curr === prev && curr !== next)
						format = 'combinedEnd';

					return (
						<Message
							key={message.timestamp}
							time={message.timestamp}
							name={message.displayName}
							text={message.text}
							isMe={message.peerId === meId}
							format={format}
						/>
					);
				})}
			</ScrollingList>
			{ !atBottom &&
				<ScrollToBottom
					variant='contained'
					onClick={() => chatHistoryRef.current?.scrollToBottom()}
					size='small'
				>
					{ chatScrollToBottomLabel() }
				</ScrollToBottom>
			}
		</Suspense>
	);
};

export default ChatHistory;