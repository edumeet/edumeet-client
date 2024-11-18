import { Grid, Typography } from '@mui/material';
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
		<Grid
			container
			direction='row'
			justifyContent='space-between'
			alignItems='center'
		>
			<Grid item>
				{ logo ?
					<img alt='Logo' src={logo} /> :
					<Typography variant='h5'> {edumeetConfig.title} </Typography>
				}
			</Grid>

			<Grid item>
				<Grid
					container
					direction='row'
					justifyContent='flex-end'
					alignItems='center'
				>
					{ loginEnabled &&
						<Grid item>
							<Grid container direction='column' alignItems='center'>
								<Grid item>
									{ loggedIn ? <LogoutButton
										type='iconbutton'
										toolTipLocation='left'
									/> : <LoginButton type="iconbutton" toolTipLocation='left' />
									}
								</Grid>
								<Grid item>
									{ loggedIn ? logoutLabel() : loginLabel() }
								</Grid>
							</Grid>
						</Grid>
					}
				</Grid>
			</Grid>
		</Grid>
	);
};

export default PrecallTitle;