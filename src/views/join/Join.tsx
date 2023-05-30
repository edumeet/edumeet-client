import { useEffect, useState } from 'react';
import {
	Button,
	Typography,
} from '@mui/material';
import TextInputField from '../../components/textinputfield/TextInputField';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	disableAllMediaLabel,
	enableAllMediaLabel,
	enableCameraLabel,
	enableMicrophoneLabel,
	joinLabel,
	yourNameLabel
} from '../../components/translated/translatedComponents';
import { AccountCircle } from '@mui/icons-material';
import MediaPreview from '../../components/mediapreview/MediaPreview';
import { stopPreviewWebcam, updatePreviewMic, updatePreviewWebcam } from '../../store/actions/mediaActions';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';
import PrecallDialog from '../../components/precalldialog/PrecallDialog';
import { roomActions } from '../../store/slices/roomSlice';
import { settingsActions } from '../../store/slices/settingsSlice';
import AudioOnlySwitch from '../../components/audioonlyswitch/AudioOnlySwitch';
import { connect } from '../../store/actions/roomActions';

interface JoinProps {
	roomId: string;
}

const Join = ({ roomId }: JoinProps): JSX.Element => {
	const stateAudioOnly = useAppSelector((state) => state.settings.audioOnly);
	const {
		previewMicTrackId,
		previewWebcamTrackId,
		videoInProgress
	} = useAppSelector((state) => state.me);
	const dispatch = useAppDispatch();

	const stateDisplayName = useAppSelector((state) => state.settings.displayName);
	const joinInProgress = useAppSelector((state) => state.room.joinInProgress);

	const [ name, setName ] = useState(stateDisplayName || '');
	const [ audioOnly, setAudioOnly ] = useState(stateAudioOnly || false);
	const {
		audioMuted,
		videoMuted
	} = useAppSelector((state) => state.settings);

	const handleDisplayNameChange = (value: string) => {
		setName(value.trim() ? value : value.trim());
	};

	const handleAudioOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setAudioOnly(event.target.checked);

		if (!videoMuted && event.target.checked)
			dispatch(stopPreviewWebcam());
		else if (videoMuted && !event.target.checked)
			dispatch(updatePreviewWebcam());
	};

	const handleJoin = () => {
		dispatch(settingsActions.setDisplayName(name));
		dispatch(settingsActions.setAudioOnly(audioOnly));

		dispatch(connect(roomId));
	};

	useEffect(() => {
		const dn = new URL(window.location.href).searchParams.get('displayName');

		if (dn) {
			dispatch(settingsActions.setDisplayName(dn));
			setName(dn);
		}
	}, []);

	useEffect(() => {
		const headless = new URL(window.location.href).searchParams.get('headless');

		if (headless) {
			const myNewURL = window.location.href.split('?')[0];
			
			window.history.pushState({}, '', myNewURL);
			handleJoin();
		}
	}, []);

	useEffect(() => {
		dispatch(roomActions.updateRoom({ id: roomId }));

		if (!audioMuted)
			dispatch(updatePreviewMic());

		if (!videoMuted && !audioOnly)
			dispatch(updatePreviewWebcam());
	}, []);

	return (
		<PrecallDialog
			content={
				<>
					<MediaPreview audioOnly={audioOnly} />
					<AudioInputChooser preview />
					{ !audioOnly && <VideoInputChooser preview /> }
					<Typography variant='h5'>
						{ (previewMicTrackId && previewWebcamTrackId) ?
							enableAllMediaLabel() : previewMicTrackId ?
								enableMicrophoneLabel() : previewWebcamTrackId ?
									enableCameraLabel() : disableAllMediaLabel()
						}
					</Typography>
					<TextInputField
						label={yourNameLabel()}
						value={name}
						setValue={handleDisplayNameChange}
						onEnter={handleJoin}
						startAdornment={<AccountCircle />}
						autoFocus
						data-testid='name-input'
					/>
					<AudioOnlySwitch
						checked={audioOnly}
						disabled={videoInProgress}
						onChange={handleAudioOnlyChange}
					/>
				</>
			}
			actions={
				<Button
					onClick={handleJoin}
					variant='contained'
					color='primary'
					disabled={!name || joinInProgress}
					fullWidth
					data-testid='join-button'
				>
					{ joinLabel() }
				</Button>
			}
		/>
	);
};

export default Join;
