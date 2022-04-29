import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	loginLabel,
	logoutLabel
} from '../translated/translatedComponents';
import { login, logout } from '../../store/actions/permissionsActions';

const LoginButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);

	return (
		<ControlButton
			toolTip={loggedIn ? logoutLabel() : loginLabel()}
			onClick={() => (loggedIn ? dispatch(logout()) : dispatch(login()))}
			{ ...props }
		>
			<AccountCircle />
		</ControlButton>
	);
};

export default LoginButton;