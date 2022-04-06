import { useIntl } from 'react-intl';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import SecurityIcon from '@mui/icons-material/Security';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { showLobbyLabel } from '../translated/translatedComponents';
import { uiActions } from '../../store/slices/uiSlice';
import { permissions } from '../../utils/roles';
import PulsingBadge from '../pulsingbadge/PulsingBadge';
import { lobbyPeersLengthSelector } from '../../store/selectors';

const LobbyButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();
	const canPromote = usePermissionSelector(permissions.PROMOTE_PEER);
	const lockDialogOpen = useAppSelector((state) => state.ui.lockDialogOpen);
	const lobbyPeersLength = useAppSelector(lobbyPeersLengthSelector);

	return (
		<ControlButton
			toolTip={showLobbyLabel(intl)}
			onClick={() => {
				dispatch(uiActions.setUi({ lockDialogOpen: !lockDialogOpen }));
			}}
			disabled={!canPromote}
			{ ...props }
		>
			<PulsingBadge
				color='primary'
				badgeContent={lobbyPeersLength}
			>
				<SecurityIcon />
			</PulsingBadge>
		</ControlButton>
	);
};

export default LobbyButton;