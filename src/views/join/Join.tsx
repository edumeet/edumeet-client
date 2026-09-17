import { useEffect } from 'react';
import { Button, Box, Link, Typography } from '@mui/material';
import TextInputField from '../../components/textinputfield/TextInputField';
import { useAppDispatch, useAppSelector, useNotifier } from '../../store/hooks';
import { joinLabel, yourNameLabel, imprintLabel, joinConsentLabel, privacyPolicyLabel, meetingTokenLabel, meetingTokenInvalidLabel, meetingTokenRequiredLabel } from '../../components/translated/translatedComponents';
import { AccountCircle, Key } from '@mui/icons-material';
import MediaPreview from '../../components/mediapreview/MediaPreview';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';
import GenericDialog from '../../components/genericdialog/GenericDialog';
import { roomActions } from '../../store/slices/roomSlice';
import settingsSlice, { settingsActions } from '../../store/slices/settingsSlice';
import { HEADLESS_PRESET, headlessFromUrl, headlessJoinPlan, layoutSettingsActions } from '../../utils/headless';
import { JOIN_ERROR_KEY } from '../../store/middlewares/roomMiddleware';
import { connect } from '../../store/actions/roomActions';
import PrecallTitle from '../../components/precalltitle/PrecallTitle';
import { ChooserDiv } from '../../components/devicechooser/DeviceChooser';
import { meActions } from '../../store/slices/meSlice';
import AudioOutputChooser from '../../components/devicechooser/AudioOutputChooser';
import { canSelectAudioOutput } from '../../store/selectors';
import edumeetConfig from '../../utils/edumeetConfig';
import { MAX_DISPLAY_NAME_LENGTH } from '../../utils/types';
import { meetingTokenFromUrl, normalizeMeetingToken, takeMeetingTokenRejection } from '../../utils/meetingToken';
import { notificationsActions } from '../../store/slices/notificationsSlice';

interface JoinProps {
	roomId: string;
}

const hasStoredJoinError = (): boolean => {
	try {
		return Boolean(sessionStorage.getItem(JOIN_ERROR_KEY));
	} catch {
		return false;
	}
};

const Join = ({ roomId }: JoinProps): React.JSX.Element | null => {
	useNotifier();
	const dispatch = useAppDispatch();

	const displayName = useAppSelector((state) => state.settings.displayName);
	const joinInProgress = useAppSelector((state) => state.room.joinInProgress);
	const mediaLoading = useAppSelector((state) => state.me.videoInProgress || state.me.audioInProgress);
	const audioMuted = useAppSelector((state) => state.me.audioMuted);
	const videoMuted = useAppSelector((state) => state.me.videoMuted);
	const showAudioOutputChooser = useAppSelector(canSelectAudioOutput);
	const meetingToken = useAppSelector((state) => state.me.meetingToken);
	const meetingTokenRejection = useAppSelector((state) => state.me.meetingTokenRejection);

	const headless = useAppSelector((state) => state.room.headless);

	const handleDisplayNameChange = (value: string) => dispatch(settingsActions.setDisplayName(value.trim() ? value : value.trim()));

	const handleJoin = () => {
		dispatch(settingsActions.setDisplayName(displayName));
		dispatch(connect(roomId));
	};

	useEffect(() => {
		const dn = new URL(window.location.href).searchParams.get('displayName');

		if (dn) dispatch(settingsActions.setDisplayName(dn));

		const urlMeetingToken = meetingTokenFromUrl(window.location.href);

		if (urlMeetingToken) dispatch(meActions.setMeetingToken(urlMeetingToken));

		const rejection = takeMeetingTokenRejection();

		if (rejection) {
			if (rejection.meetingToken) dispatch(meActions.setMeetingToken(rejection.meetingToken));
			dispatch(meActions.setMeetingTokenRejection(rejection.reason));
			dispatch(notificationsActions.enqueueNotification({
				message: rejection.reason === 'invalid' ? meetingTokenInvalidLabel() : meetingTokenRequiredLabel(),
				options: { variant: 'error' }
			}));
		}

		// headless=0 undoes the preset a headless link saved earlier in this browser.
		if (headlessFromUrl(window.location.href) === false)
			layoutSettingsActions(settingsSlice.getInitialState()).forEach(dispatch);

		if (!headless) return;

		layoutSettingsActions(HEADLESS_PRESET).forEach(dispatch);
		dispatch(meActions.setAudioMuted(true));
		dispatch(meActions.setVideoMuted(true));

		// App shows and clears this error after us; only look at it here.
		const plan = headlessJoinPlan({ rejection: rejection?.reason, joinErrorPending: hasStoredJoinError() });

		if (plan.reason) dispatch(roomActions.setLeaveReason(plan.reason));
		if (plan.autoJoin) handleJoin();
	}, []);

	const privacyUrl = edumeetConfig.privacyUrl ?? '';
	const imprintUrl = edumeetConfig.imprintUrl ?? '';

	if (headless) return null;

	return (
		<GenericDialog
			showFooter={true}
			precallTitleBackground={true}
			title={ <PrecallTitle /> }
			content={
				<>
					<MediaPreview startAudio={!audioMuted} startVideo={!videoMuted} stopAudio={false} stopVideo={false} updateSelection />
					<AudioInputChooser />
					{ showAudioOutputChooser && <AudioOutputChooser /> }
					<VideoInputChooser withBlur withVideoBackground />
					<ChooserDiv>
						<TextInputField
							label={yourNameLabel()}
							value={displayName}
							setValue={handleDisplayNameChange}
							onEnter={handleJoin}
							maxLength={MAX_DISPLAY_NAME_LENGTH}
							startAdornment={<AccountCircle />}
							autoFocus
						/>
					</ChooserDiv>
					{ meetingTokenRejection && (
						<ChooserDiv>
							<TextInputField
								label={meetingTokenLabel()}
								value={meetingToken ?? ''}
								setValue={(value) => dispatch(meActions.setMeetingToken(normalizeMeetingToken(value)))}
								onEnter={handleJoin}
								startAdornment={<Key />}
								autoFocus
							/>
						</ChooserDiv>
					) }
				</>
			}
			actions={
				<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
					{privacyUrl.trim() !== '' && (
						<Typography variant="caption" color="text.secondary" sx={{ mb: 1, textAlign: 'right' }}>
							{joinConsentLabel()}{' '}
							<Link href={privacyUrl} target="_blank" color="inherit">
								{privacyPolicyLabel()}
							</Link>
						</Typography>
					)}
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }} >
						<Box sx={{ display: 'flex', alignItems: 'center' }} >
							{imprintUrl.trim() !== '' && (
								<Link href={imprintUrl} target="_blank" color="inherit" underline="none">
									<Typography variant="caption" color="text.secondary">{ imprintLabel() }</Typography>
								</Link>
							)}
						</Box>
						<Button
							onClick={handleJoin}
							variant='contained'
							disabled={!displayName || joinInProgress || mediaLoading}
							size='small'
						>
							{ joinLabel() }
						</Button>
					</Box>
				</Box>
			}
		/>
	);
};

export default Join;
