import { AccountCircle } from '@mui/icons-material';
import { MenuItem } from '@mui/material';
import { useIntl } from 'react-intl';
import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import {
	loginLabel,
	LoginMessage,
	logoutLabel,
	LogoutMessage,
} from '../translated/translatedComponents';
import MoreActions from '../moreactions/MoreActions';
import { login, logout } from '../../store/actions/permissionsActions';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';

const Login = ({
	onClick
}: MenuItemProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const loginButtonLabel = loggedIn ? logoutLabel(intl) : loginLabel(intl);

	return (
		<MenuItem
			aria-label={loginButtonLabel}
			onClick={() => {
				onClick();
				loggedIn ? dispatch(logout()) : dispatch(login());
			}}
		>
			<AccountCircle />
			{ loggedIn ?
				<MoreActions>
					<LogoutMessage />
				</MoreActions>
				:
				<MoreActions>
					<LoginMessage />
				</MoreActions>
			}
		</MenuItem>
	);
};

export default Login;