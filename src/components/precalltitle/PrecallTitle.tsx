import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import edumeetConfig from '../../utils/edumeetConfig';
import LoginButton from '../controlbuttons/LoginButton';
import { loginLabel, logoutLabel } from '../translated/translatedComponents';
import LogoutButton from '../controlbuttons/LogoutButton';
import MeetingsButton from '../controlbuttons/MeetingsButton';
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

const ClickableLabel = styled('span')(({ theme }) => ({
	cursor: 'pointer',
	color: 'inherit',
	marginLeft: theme.spacing(0.5),
	whiteSpace: 'nowrap',
	// Hide the text label on narrow screens; icon button alone remains visible.
	[theme.breakpoints.down('sm')]: {
		display: 'none'
	}
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
			<Grid size={7} style={{ display: 'flex', alignItems: 'center' }}>
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

			<Grid size={5} style={{ display: 'flex', justifyContent: 'end', alignItems: 'center' }} >
				<MeetingsButton type='iconbutton' toolTipLocation='bottom' />
				{loginEnabled &&
					<>
						{loggedIn ? <LogoutButton
							type='iconbutton'
							toolTipLocation='bottom' /> : <LoginButton type='iconbutton' toolTipLocation='bottom' />}
						{loggedIn ? <ClickableLabel onClick={() => dispatch(logout())}>{logoutLabel()}</ClickableLabel>
							: <ClickableLabel onClick={() => dispatch(login())}>{loginLabel()}</ClickableLabel>}
					</>
				}
			</Grid>
		</PrecallTitleRoot>
	);
};

export default PrecallTitle;