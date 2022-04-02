import { AccountCircle } from '@mui/icons-material';
import { MenuItem } from '@mui/material';
import { useIntl } from 'react-intl';
import { login, logout } from '../../store/actions/permissionsActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import MoreActions from '../moreactions/MoreActions';
import {
	loginLabel,
	LoginMessage,
	logoutLabel,
	LogoutMessage
} from '../translated/translatedComponents';

interface LoginMenuProps {
	onClick: () => void;
}

const LoginMenuItem = ({ onClick }: LoginMenuProps): JSX.Element => {
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const dispatch = useAppDispatch();
	const intl = useIntl();

	const itemOnClick = () => {
		onClick();
		loggedIn ? dispatch(logout()) : dispatch(login());
	};

	const loginButtonLabel = loggedIn ? logoutLabel(intl) : loginLabel(intl);

	return (
		loginEnabled &&
			<MenuItem
				aria-label={loginButtonLabel}
				onClick={itemOnClick}
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

export default LoginMenuItem;