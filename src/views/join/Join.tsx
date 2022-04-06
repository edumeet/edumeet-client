import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
	Button,
	Typography,
} from '@mui/material';
import TextInputField from '../../components/textinputfield/TextInputField';
import { signalingActions } from '../../store/slices/signalingSlice';
import { getSignalingUrl } from '../../utils/signalingHelpers';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	DisableAllMediaMessage,
	EnableAllMediaMessage,
	EnableCameraMessage,
	EnableMicrophoneMessage,
	JoinMessage,
	yourNameLabel
} from '../../components/translated/translatedComponents';
import { AccountCircle } from '@mui/icons-material';
import MediaPreview from '../../components/mediapreview/MediaPreview';
import { settingsActions } from '../../store/slices/settingsSlice';
import { updatePreviewMic, updatePreviewWebcam } from '../../store/actions/mediaActions';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';
import PrecallDialog from '../../components/precalldialog/PrecallDialog';

interface JoinProps {
	roomId: string;
}

const Join = ({ roomId }: JoinProps): JSX.Element => {
	const intl = useIntl();
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
		<PrecallDialog
			content={
				<>
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
				</>
			}
			actions={
				<Button
					onClick={handleJoin}
					variant='contained'
					color='primary'
					disabled={!displayName}
					fullWidth
				>
					<JoinMessage />
				</Button>
			}
		/>
	);
};

export default Join;