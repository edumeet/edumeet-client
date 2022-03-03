import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import randomString from 'random-string';
import RoomNameField from '../../components/roomnamefield/RoomNameField';
import StyledBackground from '../../components/StyledBackground';
import StyledDialog from '../../components/dialog/StyledDialog';
import { RootState } from '../../store/store';
import LoginButton from '../../components/loginbutton/LoginButton';
import edumeetConfig from '../../utils/edumeetConfig';

const LandingPage = () => {
	const loggedIn = useSelector((state: RootState) => state.permissions.loggedIn);
	const navigate = useNavigate();
	const [ roomId, setRoomId ] = useState(randomString({ length: 8 }).toLowerCase());

	const onClicked = () => {
		navigate(`/${roomId}`);
	};

	return (
		<StyledBackground>
			<StyledDialog open>
				<DialogTitle>
					<Grid
						container
						direction='row'
						justifyContent='space-between'
						alignItems='center'
					>
						<Grid item>
							<Typography variant='h5'> Edumeet </Typography>
							{ edumeetConfig.logo ?
								<img alt='Logo' src={edumeetConfig.logo} /> :
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
								{ edumeetConfig.loginEnabled &&
									<Grid item>
										<Grid container direction='column' alignItems='center'>
											<Grid item>
												<LoginButton />
											</Grid>
											<Grid item>
												<FormattedMessage
													id={loggedIn ? 'label.logout' : 'label.login'}
													defaultMessage={loggedIn ? 'Logout' : 'Login'}
												/>
											</Grid>
										</Grid>
									</Grid>
								}
							</Grid>
						</Grid>
					</Grid>
				</DialogTitle>
				<DialogContent>
					<RoomNameField roomId={roomId} setRoomId={setRoomId} />
				</DialogContent>
				<DialogActions>
					<Grid
						container
						direction='row'
						justifyContent='flex-end'
						alignItems='flex-end'
						spacing={1}
					>
						<Grid item>
							<Button
								onClick={onClicked}
								variant='contained'
								color='primary'
								disabled={!roomId}
							>
								<FormattedMessage
									id='label.join'
									defaultMessage='Join'
								/>
							</Button>

						</Grid>
					</Grid>
				</DialogActions>
			</StyledDialog>
		</StyledBackground>
	);
};

export default LandingPage;