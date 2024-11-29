import { Grid2, Typography } from '@mui/material';
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
	let loggedIn = useAppSelector((state) => state.permissions.loggedIn);

	useEffect(() => {

		dispatch(checkJWT()).then(() => {
			loggedIn = useAppSelector((state) => state.permissions.loggedIn);
		});

	}, []);

	return (
		<Grid2
			container
			direction='row'
			justifyContent='space-between'
			alignItems='center'
		>
			<Grid2 item>
				{ logo ?
					<img alt='Logo' src={logo} /> :
					<Typography variant='h5'> {edumeetConfig.title} </Typography>
				}
			</Grid2>
					
			<Grid2 item>
				{ loginEnabled &&
					<Grid2 container direction='row' alignItems='center' style={{ maxHeight: '40px' }}>
						<Grid2 item>
							{ loggedIn ? <LogoutButton
								type='iconbutton'
								toolTipLocation='left'
							/> : <LoginButton type="iconbutton" toolTipLocation='left' />
							}
						</Grid2>
						<Grid2 item>
							{ loggedIn ? logoutLabel() : loginLabel() }
						</Grid2>
					</Grid2>
				}
			</Grid2>

		</Grid2>
	);
};

export default PrecallTitle;