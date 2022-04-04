import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
	Button,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	Typography,
	useTheme
} from '@mui/material';
import LoginButton from '../../components/loginbutton/LoginButton';
import TextInputField from '../../components/textinputfield/TextInputField';
import StyledBackground from '../../components/StyledBackground';
import StyledDialog from '../../components/dialog/StyledDialog';
import { signalingActions } from '../../store/slices/signalingSlice';
import { getSignalingUrl } from '../../utils/signalingHelpers';
import edumeetConfig from '../../utils/edumeetConfig';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	DisableAllMediaMessage,
	EnableAllMediaMessage,
	EnableCameraMessage,
	EnableMicrophoneMessage,
	JoinMessage,
	LoginMessage,
	LogoutMessage,
	yourNameLabel
} from '../../components/translated/translatedComponents';
import { AccountCircle } from '@mui/icons-material';
import MediaPreview from '../../components/mediapreview/MediaPreview';
import { settingsActions } from '../../store/slices/settingsSlice';
import { updatePreviewMic, updatePreviewWebcam } from '../../store/actions/mediaActions';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';

interface JoinOptions {
	roomId: string;
}

const Join = ({ roomId }: JoinOptions): JSX.Element => {
	const intl = useIntl();
	const theme = useTheme();
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const stateDisplayName = useAppSelector((state) => state.settings.displayName);
	const peerId = useAppSelector((state) => state.me.id);
	const { previewMicTrackId, previewWebcamTrackId } = useAppSelector((state) => state.me);
	const dispatch = useAppDispatch();
	const [ displayName, setDisplayName ] = useState(stateDisplayName || '');
	const {
		audioMuted,
		videoMuted
	} = useAppSelector((state) => state.settings);

	const handleDisplayNameChange = (name: string) => {
		setDisplayName(name.trim() ? name : name.trim());
	};

	const handleJoin = () => {
		const encodedRoomId = encodeURIComponent(roomId);
		const url = getSignalingUrl({ peerId, roomId: encodedRoomId });

		dispatch(settingsActions.setDisplayName(displayName));
		dispatch(signalingActions.setUrl(url));
		dispatch(signalingActions.connect());
	};

	useEffect(() => {
		if (!audioMuted) {
			dispatch(updatePreviewMic());
		}
		if (!videoMuted) {
			dispatch(updatePreviewWebcam());
		}
	}, []);

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
							<Typography variant='h5'>Edumeet</Typography>
							{ theme.logo ?
								<img alt='Logo' src={theme.logo} /> :
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
					<MediaPreview />
					<AudioInputChooser preview />
					<VideoInputChooser preview />
					<Typography variant='h5'>
						{ (previewMicTrackId && previewWebcamTrackId) ?
							<EnableAllMediaMessage /> : previewMicTrackId ?
								<EnableMicrophoneMessage /> : previewWebcamTrackId ?
									<EnableCameraMessage /> : <DisableAllMediaMessage />
						}
					</Typography>
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