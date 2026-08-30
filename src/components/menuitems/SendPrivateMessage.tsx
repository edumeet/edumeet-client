import { MenuItem } from '@mui/material';
import {
	useAppDispatch
} from '../../store/hooks';
import ChatIcon from '@mui/icons-material/Chat';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { sendPrivateMessageLabel } from '../translated/translatedComponents';
import { openDirectChat } from '../../store/actions/chatActions';

interface SendPrivateMessageProps extends MenuItemProps {
	peerId: string,
	displayName?: string,
}

const SendPrivateMessage = ({
	peerId,
	displayName,
	onClick
}: SendPrivateMessageProps): React.JSX.Element => {
	const dispatch = useAppDispatch();

	return (
		<MenuItem
			aria-label={sendPrivateMessageLabel()}
			onClick={() => {
				onClick();

				dispatch(openDirectChat(peerId, displayName));
			}}
		>
			<ChatIcon />
			<MoreActions>
				{ sendPrivateMessageLabel() }
			</MoreActions>
		</MenuItem>
	);
};

export default SendPrivateMessage;
