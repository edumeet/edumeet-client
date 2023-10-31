import {
	useAppDispatch,
	useAppSelector
} from '../../store/hooks';
import PeopleIcon from '@mui/icons-material/People';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	showParticipantsLabel,
} from '../translated/translatedComponents';
import { peersLengthSelector } from '../../store/selectors';
import { uiActions } from '../../store/slices/uiSlice';
import PulsingBadge from '../pulsingbadge/PulsingBadge';

const ParticipantsButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const peersLength = useAppSelector(peersLengthSelector);
	const participantListOpen = useAppSelector((state) => state.ui.participantListOpen);

	const openUsersTab = () => dispatch(uiActions.setUi({ participantListOpen: !participantListOpen }));

	return (
		<ControlButton
			toolTip={showParticipantsLabel()}
			onClick={() => openUsersTab()}
			on={participantListOpen}
			onColor='primary'
			{ ...props }
		>
			<PulsingBadge color='primary' badgeContent={peersLength + 1} key={peersLength}>
				<PeopleIcon />
			</PulsingBadge>
		</ControlButton>
	);
};

export default ParticipantsButton;