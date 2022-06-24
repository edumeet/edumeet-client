import { MenuItem } from '@mui/material';
import {
	useAppDispatch
} from '../../store/hooks';
import VideoIcon from '@mui/icons-material/Videocam';
import VideoOffIcon from '@mui/icons-material/VideocamOff';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { consumersActions, StateConsumer } from '../../store/slices/consumersSlice';
import { muteParticipantVideoLabel, unMuteParticipantVideoLabel } from '../translated/translatedComponents';
import { Peer } from '../../store/slices/peersSlice';

interface MuteWebcamProps extends MenuItemProps {
	peer: Peer,
	webcamConsumer: StateConsumer,
}

const MuteWebcam = ({
	peer,
	webcamConsumer,
	onClick
}: MuteWebcamProps): JSX.Element => {
	const dispatch = useAppDispatch();

	const { videoInProgress } = peer;
	const webcamEnabled = !webcamConsumer.localPaused && !webcamConsumer.remotePaused;
	const webcamLabel =
		webcamEnabled ? muteParticipantVideoLabel() : unMuteParticipantVideoLabel();

	return (
		<MenuItem
			aria-label={webcamLabel}
			disabled={videoInProgress}
			onClick={() => {
				onClick();

				if (webcamEnabled) {
					dispatch(consumersActions.setConsumerPaused({
						consumerId: webcamConsumer.id,
						local: true
					}));
				} else {
					dispatch(consumersActions.setConsumerResumed({
						consumerId: webcamConsumer.id,
						local: true
					}));
				}
			}}
		>
			{ webcamEnabled ? <VideoIcon /> : <VideoOffIcon /> }
			<MoreActions>
				{ webcamLabel }
			</MoreActions>
		</MenuItem>
	);
};

export default MuteWebcam;