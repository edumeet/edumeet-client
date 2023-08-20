import { useAppDispatch } from '../../store/hooks';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { loginLabel } from '../translated/translatedComponents';
import { login } from '../../store/actions/permissionsActions';
import React from 'react';

const LoginButton = ({
	...props
}: ControlButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();

	return (
		<ControlButton
			toolTip={loginLabel()}
			onClick={() => dispatch(login())}
			{ ...props }
		>
			<AccountCircle />
		</ControlButton>
	);
};

export default LoginButton;