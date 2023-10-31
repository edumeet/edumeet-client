import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import AdvancedAudioSettings from './advancedsettings/AdvancedAudioSettings';
import AdvancedVideoSettings from './advancedsettings/AdvancedVideoSettings';
import { audioSettingsLabel, videoSettingsLabel } from '../translated/translatedComponents';
import HeadsetMic from '@mui/icons-material/HeadsetMic';
import Videocam from '@mui/icons-material/Videocam';

const AdvancedSettings = (): JSX.Element => {
	return (
		<List>
			<ListItem>
				<ListItemIcon sx={{ minWidth: 29 }}>
					<HeadsetMic />
				</ListItemIcon>
				<ListItemText primary={ audioSettingsLabel() } />
			</ListItem>
			<AdvancedAudioSettings />
			<ListItem>
				<ListItemIcon sx={{ minWidth: 29 }}>
					<Videocam />
				</ListItemIcon>
				<ListItemText primary={ videoSettingsLabel() } />
			</ListItem>
			<AdvancedVideoSettings />
		</List>
	);
};

export default AdvancedSettings;