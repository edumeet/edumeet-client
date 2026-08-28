import { MenuItem } from '@mui/material';
import {
	useAppDispatch
} from '../../store/hooks';
import ChatIcon from '@mui/icons-material/Chat';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { sendPrivateMessageLabel } from '../translated/translatedComponents';
import { Peer } from '../../store/slices/peersSlice';
import { openDirectChat } from '../../store/actions/chatActions';

interface SendPrivateMessageProps extends MenuItemProps {
	peer: Peer,
}

const SendPrivateMessage = ({
	peer,
	onClick
}: SendPrivateMessageProps): React.JSX.Element => {
	const dispatch = useAppDispatch();

	return (
		<MenuItem
			aria-label={sendPrivateMessageLabel()}
			onClick={() => {
				onClick();

				dispatch(openDirectChat(peer.id));
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
