import { useAppSelector } from '../../store/hooks';
import { ChatMessage } from '../../utils/types';
import ScrollingList from '../scrollinglist/ScrollingList';

const ChatHistory = (): JSX.Element => {
	const chatMessages = useAppSelector((state) => state.chat);

	return (
		<ScrollingList>
			{ chatMessages.map((message: ChatMessage, i: number) =>
				<div key={i}>{message.text}</div>
			)}
		</ScrollingList>
	);
};

export default ChatHistory;