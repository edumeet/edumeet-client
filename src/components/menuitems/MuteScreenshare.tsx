import { MenuItem } from '@mui/material';
import {
	useAppDispatch
} from '../../store/hooks';
import ScreenIcon from '@mui/icons-material/ScreenShare';
import ScreenOffIcon from '@mui/icons-material/StopScreenShare';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { consumersActions, StateConsumer } from '../../store/slices/consumersSlice';
import { muteParticipantVideoLabel, unMuteParticipantVideoLabel } from '../translated/translatedComponents';
import { Peer } from '../../store/slices/peersSlice';

interface MuteScreenshareProps extends MenuItemProps {
	peer: Peer,
	screenConsumer: StateConsumer
}

const MuteScreenshare = ({
	peer,
	screenConsumer,
	onClick
}: MuteScreenshareProps): JSX.Element => {
	const dispatch = useAppDispatch();

	const { screenInProgress } = peer;
	const screenEnabled = !screenConsumer.localPaused && !screenConsumer.remotePaused;
	const sceenLabel =
		screenEnabled ? muteParticipantVideoLabel() : unMuteParticipantVideoLabel();

	return (
		<MenuItem
			aria-label={sceenLabel}
			disabled={screenInProgress}
			onClick={() => {
				onClick();

				if (screenEnabled) {
					dispatch(consumersActions.setConsumerPaused({
						consumerId: screenConsumer.id,
						local: true
					}));
				} else {
					dispatch(consumersActions.setConsumerResumed({
						consumerId: screenConsumer.id,
						local: true
					}));
				}
			}}
		>
			{ screenEnabled ? <ScreenIcon /> : <ScreenOffIcon /> }
			<MoreActions>
				{ sceenLabel }
			</MoreActions>
		</MenuItem>
	);
};

export default MuteScreenshare;