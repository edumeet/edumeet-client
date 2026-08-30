import { Button, styled } from '@mui/material';
import { Suspense, useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useAppSelector, usePermissionSelector } from '../../store/hooks';
import { permissions } from '../../utils/roles';
import ScrollingList from '../scrollinglist/ScrollingList';
import { chatScrollToBottomLabel } from '../translated/translatedComponents';
import { lazy } from 'react';
import type { MessageFormat } from './Message';

const Message = lazy(() => import('./Message'));

const ScrollToBottom = styled(Button)(({ theme }) => ({
	marginLeft: theme.spacing(4),
	marginRight: theme.spacing(4),
	marginBottom: theme.spacing(1),
}));

interface HistoryMessage {
	peerId: string;
	displayName?: string;
	timestamp?: number;
	text?: string;
}

interface ChatHistoryProps {
	messages: HistoryMessage[];
	peerActions?: boolean;
}

const ChatHistory = ({ messages, peerActions }: ChatHistoryProps): React.JSX.Element => {
	const chatHistoryRef = useRef<ScrollingList>(null);
	const [ atBottom, setAtBottom ] = useState(true);
	const meId = useAppSelector((state) => state.me.id);
	const canChat = usePermissionSelector(permissions.SEND_CHAT);
	const chatEnabled = useAppSelector((state) => state.room.chatEnabled);
	const peerIds = useAppSelector((state) => Object.keys(state.peers), shallowEqual);
	const presentPeers = useMemo(() => new Set(peerIds), [ peerIds ]);
	const showPeerActions = Boolean(peerActions && chatEnabled && canChat);

	return (
		<Suspense>
			<ScrollingList
				ref={chatHistoryRef}
				onScroll={(isAtBottom: boolean) => {
					setAtBottom(isAtBottom);
				}}
			>
				{ messages.map((message: HistoryMessage, i: number) => {
					const curr = message.peerId;
					const prev = messages[i - 1]?.peerId;
					const next = messages[i + 1]?.peerId;

					let format: MessageFormat = 'single';

					if (curr !== prev && curr === next)
						format = 'combinedBegin';
					else if (curr === prev && curr === next)
						format = 'combinedMiddle';
					else if (curr === prev && curr !== next)
						format = 'combinedEnd';

					return (
						<Message
							key={`${message.peerId}-${message.timestamp}-${i}`}
							time={message.timestamp}
							name={message.displayName}
							text={message.text}
							isMe={message.peerId === meId}
							format={format}
							peerId={message.peerId}
							peerActions={showPeerActions && presentPeers.has(message.peerId)}
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
