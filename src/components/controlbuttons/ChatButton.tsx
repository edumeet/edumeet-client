import {
	useAppDispatch,
	useAppSelector
} from '../../store/hooks';
import ChatIcon from '@mui/icons-material/Chat';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { showChatLabel } from '../translated/translatedComponents';
import { Badge } from '@mui/material';
import { uiActions } from '../../store/slices/uiSlice';

const ChatButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const chatOpen = useAppSelector((state) => state.ui.chatOpen);
	const openChatTab = () => dispatch(uiActions.setUi({ chatOpen: !chatOpen }));

	return (
		<ControlButton
			toolTip={showChatLabel()}
			onClick={() => openChatTab()}
			on={chatOpen}
			{ ...props }
		>
			<Badge color='primary'>
				<ChatIcon />
			</Badge>
		</ControlButton>
	);
};

export default ChatButton;