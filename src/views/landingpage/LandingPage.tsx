import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import randomString from 'random-string';
import StyledBackground from '../../components/StyledBackground';
import StyledDialog from '../../components/dialog/StyledDialog';
import LoginButton from '../../components/loginbutton/LoginButton';
import edumeetConfig from '../../utils/edumeetConfig';
import TextInputField from '../../components/textinputfield/TextInputField';
import { JoinMessage, LogoutMessage, roomNameLabel } from '../../components/translated/translatedComponents';

const LandingPage = (): JSX.Element => {
	const intl = useIntl();
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
												<LogoutMessage />
											</Grid>
										</Grid>
									</Grid>
								}
							</Grid>
						</Grid>
					</Grid>
				</DialogTitle>
				<DialogContent>
					<TextInputField
						label={roomNameLabel(intl)}
						value={roomId}
						setValue={setRoomId}
						randomizeOnBlank
					/>
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
								<JoinMessage />
							</Button>

						</Grid>
					</Grid>
				</DialogActions>
			</StyledDialog>
		</StyledBackground>
	);
};

export default LandingPage;