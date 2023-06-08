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
import { updatePreviewMic, updatePreviewWebcam } from '../../store/actions/mediaActions';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';
import PrecallDialog from '../../components/precalldialog/PrecallDialog';
import { roomActions } from '../../store/slices/roomSlice';
import { settingsActions } from '../../store/slices/settingsSlice';
import { connect } from '../../store/actions/roomActions';

interface JoinProps {
	roomId: string;
}

const Join = ({ roomId }: JoinProps): JSX.Element => {
	const {
		previewMicTrackId,
		previewWebcamTrackId,
	} = useAppSelector((state) => state.me);
	const dispatch = useAppDispatch();

	const stateDisplayName = useAppSelector((state) => state.settings.displayName);
	const joinInProgress = useAppSelector((state) => state.room.joinInProgress);

	const [ name, setName ] = useState(stateDisplayName || '');
	const {
		audioMuted,
		videoMuted
	} = useAppSelector((state) => state.settings);

	const handleDisplayNameChange = (value: string) => {
		setName(value.trim() ? value : value.trim());
	};

	const handleJoin = () => {
		dispatch(settingsActions.setDisplayName(name));

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

		if (!videoMuted)
			dispatch(updatePreviewWebcam());
	}, []);

	return (
		<PrecallDialog
			content={
				<>
					<MediaPreview />
					<AudioInputChooser preview />
					<VideoInputChooser preview />
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
