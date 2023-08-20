import { useAppDispatch } from '../../store/hooks';
import ControlButton, { ControlButtonProps } from './ControlButton';
import Logout from '@mui/icons-material/Logout';
import { logoutLabel } from '../translated/translatedComponents';
import { logout } from '../../store/actions/permissionsActions';
import React from 'react';

const LogoutButton = ({
	...props
}: ControlButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();

	return (
		<ControlButton
			toolTip={logoutLabel()}
			onClick={() => dispatch(logout())}
			{ ...props }
		>
			<Logout />
		</ControlButton>
	);
};

export default LogoutButton;