import { HeadsetMic, Videocam } from '@mui/icons-material';
import { List, ListItem, ListItemIcon, ListItemText, styled } from '@mui/material';
import AudioInputChooser from '../devicechooser/AudioInputChooser';
import VideoInputChooser from '../devicechooser/VideoInputChooser';
import MediaPreview from '../mediapreview/MediaPreview';
import { audioSettingsLabel, videoSettingsLabel } from '../translated/translatedComponents';
import AdvancedAudioSettings from './advancedsettings/AdvancedAudioSettings';
import AdvancedVideoSettings from './advancedsettings/AdvancedVideoSettings';
import BlurBackgroundSwitch from '../blurbackgroundswitch/BlurBackgroundSwitch';
import { useAppSelector } from '../../store/hooks';
import { isMobileSelector } from '../../store/selectors';
import { useContext, useEffect } from 'react';
import { ServiceContext } from '../../store/store';

const NestedList = styled(List)(({ theme }) => ({
	padding: theme.spacing(0, 1.5)
}));

const MediaSettings = (): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const isMobile = useAppSelector(isMobileSelector);
	const { mediaConnectionStatus, startMediaServiceInProgress } = useAppSelector((state) => state.me);

	useEffect(() => {
		if (mediaConnectionStatus === 'error' && !startMediaServiceInProgress) mediaService.retryConnection();
	}, [ mediaConnectionStatus, startMediaServiceInProgress ]);
	
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
				<AudioInputChooser withConfirm />
				<AdvancedAudioSettings />
			</NestedList>
			<ListItem>
				<ListItemIcon sx={{ minWidth: 29 }}>
					<Videocam />
				</ListItemIcon>
				<ListItemText primary={ videoSettingsLabel() } />
			</ListItem>
			<NestedList>
				<VideoInputChooser withConfirm />
				{!isMobile && <BlurBackgroundSwitch />}
				<AdvancedVideoSettings />
			</NestedList>
		</List>
	);
};

export default MediaSettings;