import { MenuItem } from '@mui/material';
import {
	useAppDispatch
} from '../../store/hooks';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { stopParticipantVideoLabel } from '../translated/translatedComponents';
import { Peer } from '../../store/slices/peersSlice';
import { stopVideo } from '../../store/actions/peerActions';

interface StopVideoProps extends MenuItemProps {
	peer: Peer
}

const StopVideo = ({
	peer,
	onClick
}: StopVideoProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const { stopVideoInProgress } = peer;

	return (
		<MenuItem
			aria-label={stopParticipantVideoLabel()}
			disabled={stopVideoInProgress}
			onClick={() => {
				onClick();

				dispatch(stopVideo(peer.id));
			}}
		>
			<VideocamOffIcon />
			<MoreActions>
				{ stopParticipantVideoLabel() }
			</MoreActions>
		</MenuItem>
	);
};

export default StopVideo;