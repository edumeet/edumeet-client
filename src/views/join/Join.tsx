import { useState } from 'react';
import { useIntl } from 'react-intl';
import { Button, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import LoginButton from '../../components/loginbutton/LoginButton';
import TextInputField from '../../components/textInputField/TextInputField';
import StyledBackground from '../../components/StyledBackground';
import StyledDialog from '../../components/dialog/StyledDialog';
import { signalingActions } from '../../store/slices/signalingSlice';
import { getSignalingUrl } from '../../utils/signalingHelpers';
import edumeetConfig from '../../utils/edumeetConfig';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { JoinMessage, LoginMessage, LogoutMessage, yourNameLabel } from '../../components/translated/translatedComponents';
import { AccountCircle } from '@mui/icons-material';

interface JoinOptions {
	roomId: string;
}

const Join = ({ roomId }: JoinOptions): JSX.Element => {
	const intl = useIntl();
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const stateDisplayName = useAppSelector((state) => state.settings.displayName);
	const peerId = useAppSelector((state) => state.me.id);
	const dispatch = useAppDispatch();
	const [ displayName, setDisplayName ] = useState(stateDisplayName || '');

	const handleDisplayNameChange = (name: string) => {
		setDisplayName(name.trim() ? name : name.trim());
	};

	const handleJoin = () => {
		const encodedRoomId = encodeURIComponent(roomId);
		const url = getSignalingUrl({ peerId, roomId: encodedRoomId });

		dispatch(signalingActions.setUrl({ url }));
		dispatch(signalingActions.connect());
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
												{ loggedIn ? <LogoutMessage />:<LoginMessage /> }
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
						label={yourNameLabel(intl)}
						value={displayName}
						setValue={handleDisplayNameChange}
						adornment={<AccountCircle />}
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
								onClick={handleJoin}
								variant='contained'
								color='primary'
								disabled={!displayName}
								fullWidth
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

export default Join;