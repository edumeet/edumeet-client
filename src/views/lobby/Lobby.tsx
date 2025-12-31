import { AccountCircle } from '@mui/icons-material';
import { Box, Link, Typography } from '@mui/material';
import { useState } from 'react';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';
import MediaPreview from '../../components/mediapreview/MediaPreview';
import GenericDialog from '../../components/genericdialog/GenericDialog';
import TextInputField from '../../components/textinputfield/TextInputField';
import { roomLockedLabel, yourNameLabel, imprintLabel, privacyLabel } from '../../components/translated/translatedComponents';
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
import edumeetConfig from '../../utils/edumeetConfig';

const Lobby = (): React.JSX.Element => {
	useNotifier();

	const dispatch = useAppDispatch();
	const displayName = useAppSelector((state) => state.settings.displayName);
	const [ localDisplayName, setLocalDisplayName ] = useState(displayName);
	const showAudioOutputChooser = useAppSelector(canSelectAudioOutput);

	const handleDisplayNameChange = () => {
		dispatch(setDisplayName(
			(localDisplayName?.trim() ? localDisplayName : localDisplayName?.trim()) || 'Guest'
		));
	};

	const privacyUrl = edumeetConfig.privacyUrl ?? '';
	const imprintUrl = edumeetConfig.imprintUrl ?? '';

	return (
		<GenericDialog
			precallTitleBackground={true}
			title={ <PrecallTitle /> }
			content={
				<>
					<MediaPreview />
					<AudioInputChooser />
					{showAudioOutputChooser && <AudioOutputChooser /> }
					<VideoInputChooser withBlur />
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
			actions={
				<Box display="flex" flexDirection="column" alignItems="center" justifyContent="space-between" width="100%">
					{roomLockedLabel()}
					<Box display="flex" alignItems="left">
						{imprintUrl.trim() !== '' && (
							<Link href={imprintUrl} target="_blank" color="inherit" underline="none">
								<Typography variant="body2">{ imprintLabel() }</Typography>
							</Link>
						)}
						{privacyUrl.trim() !== '' && (
							<Link href={privacyUrl} target="_blank" color="inherit" underline="none" style={{ marginLeft: '16px' }}>
								<Typography variant="body2">{ privacyLabel() }</Typography>
							</Link>
						)}
					</Box>
				</Box>
			}
		/>
	);
};

export default Lobby;
