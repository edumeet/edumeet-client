import {
	useAppDispatch,
	useAppSelector
} from '../../store/hooks';
import ChatIcon from '@mui/icons-material/Chat';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	showChatLabel,
} from '../translated/translatedComponents';
import { drawerActions } from '../../store/slices/drawerSlice';
import { Badge } from '@mui/material';
import { batch } from 'react-redux';
import { uiActions } from '../../store/slices/uiSlice';

const ChatButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const unreadMessages = useAppSelector((state) => state.drawer.unreadMessages);
	const chatOpen = useAppSelector((state) => state.ui.chatOpen);

	const openChatTab = () => {
		batch(() => {
			dispatch(drawerActions.toggle());
			dispatch(drawerActions.setTab('chat'));
			dispatch(uiActions.setUi({ chatOpen: !chatOpen }));
		});
	};

	return (
		<ControlButton
			toolTip={showChatLabel()}
			onClick={() => openChatTab()}
			on={chatOpen}
			{ ...props }
		>
			<Badge
				color='primary'
				badgeContent={unreadMessages}
			>
				<ChatIcon />
			</Badge>
		</ControlButton>
	);
};

export default ChatButton;