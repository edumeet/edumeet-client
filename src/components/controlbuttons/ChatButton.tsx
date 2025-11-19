import {
	useAppDispatch,
	useAppSelector
} from '../../store/hooks';
import ChatIcon from '@mui/icons-material/Chat';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { showChatLabel } from '../translated/translatedComponents';
import { uiActions } from '../../store/slices/uiSlice';
import PulsingBadge from '../pulsingbadge/PulsingBadge';

const ChatButton = ({
	...props
}: ControlButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const unreadMessages = useAppSelector((state) => state.ui.unreadMessages);
	const chatOpen = useAppSelector((state) => state.ui.chatOpen);
	const openChatTab = () => dispatch(uiActions.setUi({ chatOpen: !chatOpen }));

	return (
		<ControlButton
			toolTip={showChatLabel()}
			onClick={() => openChatTab()}
			on={chatOpen}
			{ ...props }
		>
			<PulsingBadge color='primary' badgeContent={unreadMessages} key={unreadMessages}>
				<ChatIcon />
			</PulsingBadge>
		</ControlButton>
	);
};

export default ChatButton;