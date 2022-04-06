import { MenuItem } from '@mui/material';
import { useIntl } from 'react-intl';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector,
} from '../../store/hooks';
import {
	LockMessage,
	lockRoomLabel,
	UnlockMessage,
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
}: MenuItemProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();
	const canLock = usePermissionSelector(permissions.CHANGE_ROOM_LOCK);
	const locked = useAppSelector((state) => state.permissions.locked);
	const lockLabel = locked ? unlockRoomLabel(intl) : lockRoomLabel(intl);

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
			{ locked ?
				<MoreActions>
					<UnlockMessage />
				</MoreActions>
				:
				<MoreActions>
					<LockMessage />
				</MoreActions>
			}
		</MenuItem>
	);
};

export default Lock;