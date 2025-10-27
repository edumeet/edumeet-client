import { MenuItem } from '@mui/material';
import {
	useAppDispatch
} from '../../store/hooks';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeOnIcon from '@mui/icons-material/VolumeUp';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { consumersActions, StateConsumer } from '../../store/slices/consumersSlice';
import { muteAudioLabel, unmuteAudioLabel } from '../translated/translatedComponents';
import { Peer } from '../../store/slices/peersSlice';

interface MuteAudioProps extends MenuItemProps {
	peer: Peer,
	micConsumer: StateConsumer,
}

const MuteAudio = ({
	peer,
	micConsumer,
	onClick
}: MuteAudioProps): React.JSX.Element => {
	const dispatch = useAppDispatch();

	const { audioInProgress } = peer;
	const micEnabled = !micConsumer.localPaused;
	const micLabel = micEnabled ? muteAudioLabel() : unmuteAudioLabel();

	return (
		<MenuItem
			aria-label={micLabel}
			disabled={audioInProgress}
			onClick={() => {
				onClick();

				if (micEnabled) {
					dispatch(consumersActions.setConsumerPaused({
						consumerId: micConsumer.id,
						local: true
					}));
				} else {
					dispatch(consumersActions.setConsumerResumed({
						consumerId: micConsumer.id,
						local: true
					}));
				}
			}}
		>
			{ micEnabled ? <VolumeOnIcon /> : <VolumeOffIcon /> }
			<MoreActions>
				{ micLabel }
			</MoreActions>
		</MenuItem>
	);
};

export default MuteAudio;