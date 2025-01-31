import { useAppDispatch } from '../../store/hooks';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { loginLabel } from '../translated/translatedComponents';
import { login } from '../../store/actions/permissionsActions';
import React from 'react';
import { Button } from '@mui/material';
import Grid from '@mui/material/Grid2';
import LoginIcon from '@mui/icons-material/Login';
import edumeetConfig from '../../utils/edumeetConfig';

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

export const CustomLoginButton = (): React.JSX.Element => {
	const dispatch = useAppDispatch();

	const loginImageURL = edumeetConfig.loginImageURL;

	return (
		<Button
			onClick={() => dispatch(login())}
		>
			<Grid container spacing={2}>
				<Grid size={12}>
					{ loginImageURL!='' && <img src={loginImageURL} alt='login' />}
					{ loginImageURL=='' && <LoginIcon />}
				</Grid>
				<Grid size={12}>
					Tenant {loginLabel()}		
				</Grid>
			</Grid>
		</Button>
	);
};

export default LoginButton;