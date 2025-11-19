import { MenuItem } from '@mui/material';
import {
	useAppDispatch
} from '../../store/hooks';
import ScreenOffIcon from '@mui/icons-material/StopScreenShare';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { stopParticipantScreenSharingLabel } from '../translated/translatedComponents';
import { Peer } from '../../store/slices/peersSlice';
import { stopScreenSharing } from '../../store/actions/peerActions';

interface StopScreenshareProps extends MenuItemProps {
	peer: Peer
}

const StopScreenshare = ({
	peer,
	onClick
}: StopScreenshareProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const { stopScreenSharingInProgress } = peer;

	return (
		<MenuItem
			aria-label={stopParticipantScreenSharingLabel()}
			disabled={stopScreenSharingInProgress}
			onClick={() => {
				onClick();

				dispatch(stopScreenSharing(peer.id));
			}}
		>
			<ScreenOffIcon />
			<MoreActions>
				{ stopParticipantScreenSharingLabel() }
			</MoreActions>
		</MenuItem>
	);
};

export default StopScreenshare;