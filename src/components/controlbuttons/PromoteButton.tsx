import {
	useAppDispatch,
} from '../../store/hooks';
import PromoteIcon from '@mui/icons-material/OpenInBrowser';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	promoteFromLobbyLabel,
} from '../translated/translatedComponents';
import { LobbyPeer } from '../../store/slices/lobbyPeersSlice';
import { promotePeer } from '../../store/actions/permissionsActions';

interface PromoteButtonProps extends ControlButtonProps {
	peer: LobbyPeer;
	canPromote: boolean;
}

const PromoteButton = ({
	peer,
	canPromote,
	...props
}: PromoteButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();

	return (
		<ControlButton
			toolTip={promoteFromLobbyLabel()}
			onClick={() => {
				dispatch(promotePeer(peer.id));
			}}
			disabled={!canPromote || peer.promotionInProgress}
			{ ...props }
		>
			<PromoteIcon />
		</ControlButton>
	);
};

export default PromoteButton;