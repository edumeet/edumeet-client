import { AccountCircle } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { permissionsActions } from '../../store/slices/permissionsSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

const LoginButton = () => {
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const dispatch = useAppDispatch();

	return (
		<IconButton
			onClick={() => dispatch(permissionsActions.setLoggedIn({ loggedIn: !loggedIn }))}
		>
			<AccountCircle />
		</IconButton>
	);
};

export default LoginButton;