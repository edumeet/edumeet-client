import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import edumeetConfig from '../../utils/edumeetConfig';
import LoginButton from '../controlbuttons/LoginButton';
import { loginLabel, logoutLabel } from '../translated/translatedComponents';
import LogoutButton from '../controlbuttons/LogoutButton';
import React, { useEffect } from 'react';
import { checkJWT, login, logout } from '../../store/actions/permissionsActions';
import { styled } from '@mui/material/styles';

const PrecallTitleRoot = styled(Grid)(({ theme }) => ({
	backgroundColor: theme.precallTitleColor,
	color: theme.precallTitleTextColor,
	padding: theme.spacing(1),
	borderRadius: theme.roundedness,
	alignItems: 'center',
	'& .MuiIconButton-root, & .MuiSvgIcon-root': {
		color: theme.precallTitleIconColor,
	},
}));

const ClickableLabel = styled('span')(() => ({
	cursor: 'pointer',
	color: 'inherit',
}));

const PrecallTitle = (): React.JSX.Element => {
	const dispatch = useAppDispatch();

	const logo = useAppSelector((state) => state.room.logo) || edumeetConfig.theme.logo;
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);

	useEffect(() => {
		dispatch(checkJWT());
	}, []);

	return (
		<PrecallTitleRoot container spacing={2}>
			<Grid size={8}>
				{logo ? (
					<img
						style={{ height: '32px', maxHeight: '32px', maxWidth: '200px' }}
						alt='Logo'
						src={logo}
					/>
				) : (
					<Typography variant='h5' color='inherit'> {edumeetConfig.title} </Typography>
				)}
			</Grid>

			<Grid size={4} style={{ display: 'flex', justifyContent: 'end' }} >
				{loginEnabled &&
					<>
						{loggedIn ? <LogoutButton
							type='iconbutton'
							toolTipLocation='left' /> : <LoginButton type='iconbutton' toolTipLocation='left' />}
						{loggedIn ? <ClickableLabel onClick={() => dispatch(logout())}>{logoutLabel()}</ClickableLabel>
							: <ClickableLabel onClick={() => dispatch(login())}>{loginLabel()}</ClickableLabel>}
					</>
				}
			</Grid>
		</PrecallTitleRoot>
	);
};

export default PrecallTitle;