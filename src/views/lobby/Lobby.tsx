import { AccountCircle } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';
import MediaPreview from '../../components/mediapreview/MediaPreview';
import PrecallDialog from '../../components/precalldialog/PrecallDialog';
import TextInputField from '../../components/textinputfield/TextInputField';
import {
	DisableAllMediaMessage,
	EnableAllMediaMessage,
	EnableCameraMessage,
	EnableMicrophoneMessage,
	yourNameLabel
} from '../../components/translated/translatedComponents';
import { useAppSelector } from '../../store/hooks';

const Lobby = (): JSX.Element => {
	const intl = useIntl();
	const stateDisplayName = useAppSelector((state) => state.settings.displayName);
	const { previewMicTrackId, previewWebcamTrackId } = useAppSelector((state) => state.me);
	const [ displayName, setDisplayName ] = useState(stateDisplayName || '');

	const handleDisplayNameChange = (name: string) => {
		setDisplayName(name.trim() ? name : name.trim());
	};

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
						startAdornment={<AccountCircle />}
					/>
				</>
			}
		/>
	);
};

export default Lobby;