import { AccountCircle } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { useState } from 'react';
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
import { setDisplayName } from '../../store/actions/meActions';
import {
	useAppDispatch,
	useAppSelector,
	usePrompt
} from '../../store/hooks';

const Lobby = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const displayName = useAppSelector((state) => state.settings.displayName);
	const {
		previewMicTrackId,
		previewWebcamTrackId,
	} = useAppSelector((state) => state.me);
	const [ localDisplayName, setLocalDisplayName ] = useState(displayName);

	usePrompt();

	const handleDisplayNameChange = () => {
		dispatch(setDisplayName(
			(localDisplayName?.trim() ? localDisplayName : localDisplayName?.trim()) ?? 'Guest'
		));
	};

	return (
		<PrecallDialog
			content={
				<>
					{ roomLockedLabel() }
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
						value={localDisplayName ?? 'Guest'}
						setValue={setLocalDisplayName}
						startAdornment={<AccountCircle />}
						onBlur={handleDisplayNameChange}
					/>
				</>
			}
		/>
	);
};

export default Lobby;