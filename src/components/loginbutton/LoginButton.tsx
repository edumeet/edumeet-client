import { useDispatch, useSelector } from 'react-redux';
import { AccountCircle } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { RootState } from '../../store/store';
import { permissionsActions } from '../../store/slices/permissionsSlice';

const LoginButton = () => {
	const loggedIn = useSelector((state: RootState) => state.permissions.loggedIn);
	const dispatch = useDispatch();

	return (
		<IconButton
			onClick={() => dispatch(permissionsActions.setLoggedIn({ loggedIn: !loggedIn }))}
		>
			<AccountCircle />
		</IconButton>
	);
};

export default LoginButton;