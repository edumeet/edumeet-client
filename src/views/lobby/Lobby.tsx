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

const Lobby = (): JSX.Element => {
	useNotifier();

	const dispatch = useAppDispatch();
	const displayName = useAppSelector((state) => state.settings.displayName);
	const isMobile = useAppSelector(isMobileSelector);
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
					<AudioInputChooser />
					{canSelectAudioOutput && <AudioOutputChooser /> }
					<VideoInputChooser />
					{!isMobile && <BlurBackgroundSwitch />}
					<TextInputField
						label={yourNameLabel()}
						value={localDisplayName ?? 'Guest'}
						setValue={setLocalDisplayName}
						startAdornment={<AccountCircle />}
						onBlur={handleDisplayNameChange}
					/>
				</>
			}
			actions={roomLockedLabel()}
		/>
	);
};

export default Lobby;