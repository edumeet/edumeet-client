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
import { checkJWT, login, logout } from '../../store/actions/permissionsActions';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import { useEffect } from 'react';

const Login = ({
	onClick
}: MenuItemProps): React.JSX.Element => {

	const dispatch = useAppDispatch();
	let loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const loginButtonLabel = loggedIn ? logoutLabel() : loginLabel();

	useEffect(() => {

		dispatch(checkJWT()).then(() => {
			loggedIn = useAppSelector((state) => state.permissions.loggedIn);
		});

	}, []);

	return (
		<MenuItem
			aria-label={loginButtonLabel}
			onClick={() => {
				onClick();
				if (loggedIn) { dispatch(logout()); } else { dispatch(login()); }
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