import { AccountCircle } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { login, logout } from '../../store/actions/permissionsActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

const LoginButton = (): JSX.Element => {
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const dispatch = useAppDispatch();

	return (
		<IconButton
			onClick={() => (loggedIn ? dispatch(logout()) : dispatch(login()))}
		>
			<AccountCircle />
		</IconButton>
	);
};

export default LoginButton;