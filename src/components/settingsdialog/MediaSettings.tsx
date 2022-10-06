import { HeadsetMic, Videocam } from '@mui/icons-material';
import { List, ListItem, ListItemIcon, ListItemText, styled } from '@mui/material';
import AudioPresetSelector from '../audiopresetselector/AudioPresetSelector';
import AudioInputChooser from '../devicechooser/AudioInputChooser';
import VideoInputChooser from '../devicechooser/VideoInputChooser';
import MediaPreview from '../mediapreview/MediaPreview';
import { audioSettingsLabel, videoSettingsLabel } from '../translated/translatedComponents';
import AdvancedAudioSettings from './audiosettings/AdvancedAudioSettings';
import AdvancedVideoSettings from './videosettings/AdvancedVideoSettings';

const NestedList = styled(List)(({ theme }) => ({
	padding: theme.spacing(0, 1.5)
}));

const MediaSettings = (): JSX.Element => {
	return (
		<List>
			<MediaPreview withControls={false} />
			<ListItem>
				<ListItemIcon sx={{ minWidth: 29 }}>
					<HeadsetMic />
				</ListItemIcon>
				<ListItemText primary={ audioSettingsLabel() } />
			</ListItem>
			<NestedList>
				<AudioInputChooser preview withConfirm />
				<AudioPresetSelector />
				<AdvancedAudioSettings />
			</NestedList>
			<ListItem>
				<ListItemIcon sx={{ minWidth: 29 }}>
					<Videocam />
				</ListItemIcon>
				<ListItemText primary={ videoSettingsLabel() } />
			</ListItem>
			<NestedList>
				<VideoInputChooser preview withConfirm />
				<AdvancedVideoSettings />
			</NestedList>
		</List>
	);
};

export default MediaSettings;