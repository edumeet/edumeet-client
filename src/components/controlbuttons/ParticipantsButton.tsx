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
import { Badge } from '@mui/material';
import { uiActions } from '../../store/slices/uiSlice';

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
			<Badge color='primary' badgeContent={peersLength + 1}>
				<PeopleIcon />
			</Badge>
		</ControlButton>
	);
};

export default ParticipantsButton;