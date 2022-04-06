import { Badge, MenuItem } from '@mui/material';
import { useIntl } from 'react-intl';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	showParticipantsLabel,
	ShowParticipantsMessage
} from '../translated/translatedComponents';
import MoreActions from '../moreactions/MoreActions';
import PeopleIcon from '@mui/icons-material/People';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import { drawerActions } from '../../store/slices/drawerSlice';
import { peersLengthSelector } from '../../store/selectors';

const Participants = ({
	onClick
}: MenuItemProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();
	const peersLength = useAppSelector(peersLengthSelector);

	const openUsersTab = () => {
		dispatch(drawerActions.toggle());
		dispatch(drawerActions.setTab('users'));
	};

	return (
		<MenuItem
			aria-label={showParticipantsLabel(intl)}
			onClick={() => {
				onClick();
				openUsersTab();
			}}
		>
			<Badge
				color='primary'
				badgeContent={peersLength + 1}
			>
				<PeopleIcon />
			</Badge>
			<MoreActions>
				<ShowParticipantsMessage />
			</MoreActions>
		</MenuItem>
	);
};

export default Participants;