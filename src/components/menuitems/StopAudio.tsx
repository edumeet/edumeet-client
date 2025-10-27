import { MenuItem } from '@mui/material';
import {
	useAppDispatch
} from '../../store/hooks';
import MicOffIcon from '@mui/icons-material/MicOff';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { stopParticipantAudioLabel } from '../translated/translatedComponents';
import { Peer } from '../../store/slices/peersSlice';
import { stopAudio } from '../../store/actions/peerActions';

interface StopAudioProps extends MenuItemProps {
	peer: Peer
}

const StopAudio = ({
	peer,
	onClick
}: StopAudioProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const { stopAudioInProgress } = peer;

	return (
		<MenuItem
			aria-label={stopParticipantAudioLabel()}
			disabled={stopAudioInProgress}
			onClick={() => {
				onClick();

				dispatch(stopAudio(peer.id));
			}}
		>
			<MicOffIcon />
			<MoreActions>
				{ stopParticipantAudioLabel() }
			</MoreActions>
		</MenuItem>
	);
};

export default StopAudio;