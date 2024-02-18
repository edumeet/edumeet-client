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
import { ChooserDiv } from '../../components/devicechooser/DeviceChooser';
import AudioOutputChooser from '../../components/devicechooser/AudioOutputChooser';
import { canSelectAudioOutput } from '../../store/selectors';

const Lobby = (): React.JSX.Element => {
	useNotifier();

	const dispatch = useAppDispatch();
	const displayName = useAppSelector((state) => state.settings.displayName);
	const [ localDisplayName, setLocalDisplayName ] = useState(displayName);
	const showAudioOutputChooser = useAppSelector(canSelectAudioOutput);

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
					{showAudioOutputChooser && <AudioOutputChooser /> }
					<VideoInputChooser />
					<ChooserDiv>
						<TextInputField
							label={yourNameLabel()}
							value={localDisplayName ?? 'Guest'}
							setValue={setLocalDisplayName}
							startAdornment={<AccountCircle />}
							onBlur={handleDisplayNameChange}
						/>
					</ChooserDiv>
				</>
			}
			actions={roomLockedLabel()}
		/>
	);
};

export default Lobby;