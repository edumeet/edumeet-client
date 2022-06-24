import { AccountCircle } from '@mui/icons-material';
import { MenuItem } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import {
	loginLabel,
	logoutLabel,
} from '../translated/translatedComponents';
import MoreActions from '../moreactions/MoreActions';
import { login, logout } from '../../store/actions/permissionsActions';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';

const Login = ({
	onClick
}: MenuItemProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const loginButtonLabel = loggedIn ? logoutLabel() : loginLabel();

	return (
		<MenuItem
			aria-label={loginButtonLabel}
			onClick={() => {
				onClick();
				loggedIn ? dispatch(logout()) : dispatch(login());
			}}
		>
			<AccountCircle />
			<MoreActions>
				{ loginButtonLabel }
			</MoreActions>
		</MenuItem>
	);
};

export default Login;