import Grid from '@mui/material/Grid2';
import { Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import edumeetConfig from '../../utils/edumeetConfig';
import LoginButton from '../controlbuttons/LoginButton';
import { loginLabel, logoutLabel } from '../translated/translatedComponents';
import LogoutButton from '../controlbuttons/LogoutButton';
import React, { useEffect } from 'react';
import { checkJWT } from '../../store/actions/permissionsActions';

const PrecallTitle = (): React.JSX.Element => {
	const dispatch = useAppDispatch();

	const logo = useAppSelector((state) => state.room.logo);
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);

	useEffect(() => {
		dispatch(checkJWT());
	}, []);

	return (
		<Grid container spacing={2}>
			<Grid size={8}>
				{logo ?
					<img alt='Logo' src={logo} /> :
					<Typography variant='h5'> {edumeetConfig.title} </Typography>}
			</Grid>
			<Grid size={4} style={{ display: 'flex', justifyContent: 'end' }} >
				{loginEnabled &&
					<>
						{loggedIn ? <LogoutButton
							type='iconbutton'
							toolTipLocation='left' /> : <LoginButton type="iconbutton" toolTipLocation='left' />}
						{loggedIn ? logoutLabel() : loginLabel()}
					</>
				}
			</Grid>
		</Grid>
	);
};

export default PrecallTitle;