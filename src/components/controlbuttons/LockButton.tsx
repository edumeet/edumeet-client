import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	lockRoomLabel,
	unlockRoomLabel
} from '../translated/translatedComponents';
import { permissions } from '../../utils/roles';
import { lock, unlock } from '../../store/actions/permissionsActions';

const LockButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const locked = useAppSelector((state) => state.permissions.locked);
	const canChangeLock = usePermissionSelector(permissions.CHANGE_ROOM_LOCK);

	return (
		<ControlButton
			toolTip={locked ? unlockRoomLabel() : lockRoomLabel()}
			onClick={() =>
				(locked ? dispatch(unlock()) : dispatch(lock()))
			}
			disabled={!canChangeLock}
			{ ...props }
		>
			{ locked ? <LockIcon />:<LockOpenIcon /> }
		</ControlButton>
	);
};

export default LockButton;