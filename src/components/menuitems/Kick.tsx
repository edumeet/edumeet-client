import { MenuItem } from '@mui/material';
import {
	useAppDispatch
} from '../../store/hooks';
import ExitIcon from '@mui/icons-material/ExitToApp';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { kickLabel } from '../translated/translatedComponents';
import { Peer } from '../../store/slices/peersSlice';
import { kickPeer } from '../../store/actions/peerActions';

interface KickProps extends MenuItemProps {
	peer: Peer,
}

const Kick = ({
	peer,
	onClick
}: KickProps): JSX.Element => {
	const dispatch = useAppDispatch();

	const { kickInProgress } = peer;

	return (
		<MenuItem
			aria-label={kickLabel()}
			disabled={kickInProgress}
			onClick={() => {
				onClick();

				dispatch(kickPeer(peer.id));
			}}
		>
			<ExitIcon />
			<MoreActions>
				{ kickLabel() }
			</MoreActions>
		</MenuItem>
	);
};

export default Kick;