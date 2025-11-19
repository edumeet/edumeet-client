import { MenuItem } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector,
} from '../../store/hooks';
import {
	lockRoomLabel,
	unlockRoomLabel,
} from '../translated/translatedComponents';
import MoreActions from '../moreactions/MoreActions';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { lock, unlock } from '../../store/actions/permissionsActions';
import { permissions } from '../../utils/roles';

const Lock = ({
	onClick
}: MenuItemProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const canLock = usePermissionSelector(permissions.CHANGE_ROOM_LOCK);
	const locked = useAppSelector((state) => state.permissions.locked);
	const lockLabel = locked ? unlockRoomLabel() : lockRoomLabel();

	return (
		<MenuItem
			aria-label={lockLabel}
			disabled={!canLock}
			onClick={() => {
				onClick();

				locked ? dispatch(unlock()) : dispatch(lock());
			}}
		>
			{ locked ? <LockIcon /> : <LockOpenIcon /> }
			<MoreActions>
				{ lockLabel }
			</MoreActions>
		</MenuItem>
	);
};

export default Lock;