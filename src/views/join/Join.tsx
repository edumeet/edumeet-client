import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { FormattedMessage } from 'react-intl';
import { Button, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import LoginButton from '../../components/loginbutton/LoginButton';
import DisplayNameField from '../../components/displaynamefield/DisplayNameField';
import StyledBackground from '../../components/StyledBackground';
import StyledDialog from '../../components/dialog/StyledDialog';
import { signalingActions } from '../../store/slices/signalingSlice';
import { getSignalingUrl } from '../../utils/signalingHelpers';
import edumeetConfig from '../../utils/edumeetConfig';

interface JoinOptions {
	roomId: string;
}

// eslint-disable-next-line no-empty-pattern
const Join = ({ roomId }: JoinOptions) => {
	const loggedIn = useSelector((state: RootState) => state.permissions.loggedIn);
	const stateDisplayName = useSelector((state: RootState) => state.settings.displayName);
	const peerId = useSelector((state: RootState) => state.me.id);
	const dispatch = useDispatch();
	const [ displayName, setDisplayName ] = useState(stateDisplayName || '');

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
					<DisplayNameField
						displayName={displayName}
						setDisplayName={setDisplayName}
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

export default Join;