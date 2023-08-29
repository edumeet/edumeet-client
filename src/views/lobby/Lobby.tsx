import { AccountCircle } from '@mui/icons-material';
import { useState } from 'react';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';
import MediaPreview from '../../components/mediapreview/MediaPreview';
import GenericDialog from '../../components/genericdialog/GenericDialog';
import TextInputField from '../../components/textinputfield/TextInputField';
import { roomLockedLabel, yourNameLabel } from '../../components/translated/translatedComponents';
import { setDisplayName } from '../../store/actions/meActions';
import {
	useAppDispatch,
	useAppSelector,
	useNotifier,
} from '../../store/hooks';
import PrecallTitle from '../../components/precalltitle/PrecallTitle';
import BlurBackgroundSwitch from '../../components/blurbackgroundswitch/BlurBackgroundSwitch';
import { isMobileSelector } from '../../store/selectors';
import AudioOutputChooser from '../../components/devicechooser/AudioOutputChooser';
import { ChooserDiv } from '../../components/devicechooser/DeviceChooser';

const Lobby = (): React.JSX.Element => {
	useNotifier();

	const dispatch = useAppDispatch();
	const displayName = useAppSelector((state) => state.settings.displayName);
	const isMobile = useAppSelector(isMobileSelector);
	const showAudioChooser = useAppSelector((state) => state.media.previewAudioInputDeviceId && !state.media.audioMuted);
	const showVideoChooser = useAppSelector((state) => state.media.previewVideoDeviceId && !state.media.videoMuted);
	const { canSelectAudioOutput } = useAppSelector((state) => state.me);
	const [ localDisplayName, setLocalDisplayName ] = useState(displayName);

	const handleDisplayNameChange = () => {
		dispatch(setDisplayName(
			(localDisplayName?.trim() ? localDisplayName : localDisplayName?.trim()) ?? 'Guest'
		));
	};

	return (
		<GenericDialog
			title={ <PrecallTitle /> }
			content={
				<>
					<MediaPreview />
					{showAudioChooser && <AudioInputChooser /> }
					{showVideoChooser && <VideoInputChooser /> }
					{showVideoChooser && !isMobile && <BlurBackgroundSwitch />}
					{canSelectAudioOutput && <AudioOutputChooser /> }
					<ChooserDiv>
						<TextInputField
							label={yourNameLabel()}
							value={localDisplayName ?? 'Guest'}
							setValue={setLocalDisplayName}
							startAdornment={<AccountCircle />}
							onBlur={handleDisplayNameChange}
						/></ChooserDiv>
				</>
			}
			actions={roomLockedLabel()}
		/>
	);
};

export default Lobby;