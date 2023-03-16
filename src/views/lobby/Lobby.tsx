import { AccountCircle } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { useState } from 'react';
import AudioOnlySwitch from '../../components/audioonlyswitch/AudioOnlySwitch';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';
import MediaPreview from '../../components/mediapreview/MediaPreview';
import PrecallDialog from '../../components/precalldialog/PrecallDialog';
import TextInputField from '../../components/textinputfield/TextInputField';
import {
	disableAllMediaLabel,
	enableAllMediaLabel,
	enableCameraLabel,
	enableMicrophoneLabel,
	roomLockedLabel,
	yourNameLabel
} from '../../components/translated/translatedComponents';
import { setAudioOnly, setDisplayName } from '../../store/actions/meActions';
import { stopPreviewWebcam, updatePreviewWebcam } from '../../store/actions/mediaActions';
import {
	useAppDispatch,
	useAppSelector,
	usePrompt
} from '../../store/hooks';

const Lobby = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const displayName = useAppSelector((state) => state.settings.displayName);
	const audioOnly = useAppSelector((state) => state.settings.audioOnly);
	const {
		previewMicTrackId,
		previewWebcamTrackId,
		videoInProgress
	} = useAppSelector((state) => state.me);
	const [ localDisplayName, setLocalDisplayName ] = useState(displayName);
	const [ localAudioOnly, setLocalAudioOnly ] = useState(audioOnly);
	const { videoMuted } = useAppSelector((state) => state.settings);

	usePrompt(true);

	const handleDisplayNameChange = () => {
		dispatch(setDisplayName(
			(localDisplayName?.trim() ? localDisplayName : localDisplayName?.trim()) ?? 'Guest'
		));
	};

	const handleAudioOnlyChage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setLocalAudioOnly(event.target.checked);
		dispatch(setAudioOnly(event.target.checked));

		if (!videoMuted && event.target.checked)
			dispatch(stopPreviewWebcam());
		else if (videoMuted && !event.target.checked)
			dispatch(updatePreviewWebcam());
	};

	return (
		<PrecallDialog
			content={
				<>
					{ roomLockedLabel() }
					<MediaPreview audioOnly={localAudioOnly} />
					<AudioInputChooser preview />
					{ !localAudioOnly && <VideoInputChooser preview /> }
					<Typography variant='h5'>
						{ (previewMicTrackId && previewWebcamTrackId) ?
							enableAllMediaLabel() : previewMicTrackId ?
								enableMicrophoneLabel() : previewWebcamTrackId ?
									enableCameraLabel() : disableAllMediaLabel()
						}
					</Typography>
					<TextInputField
						label={yourNameLabel()}
						value={localDisplayName ?? 'Guest'}
						setValue={setLocalDisplayName}
						startAdornment={<AccountCircle />}
						onBlur={handleDisplayNameChange}
					/>
					<AudioOnlySwitch
						checked={localAudioOnly}
						disabled={videoInProgress}
						onChange={handleAudioOnlyChage}
					/>
				</>
			}
		/>
	);
};

export default Lobby;