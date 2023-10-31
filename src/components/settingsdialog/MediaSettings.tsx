import { List, styled } from '@mui/material';
import AudioInputChooser from '../devicechooser/AudioInputChooser';
import VideoInputChooser from '../devicechooser/VideoInputChooser';
import MediaPreview from '../mediapreview/MediaPreview';
import { BlurSwitch } from './SettingsSwitches';

const NestedList = styled(List)(({ theme }) => ({
	padding: theme.spacing(0, 1.5)
}));

const MediaSettings = (): JSX.Element => {
	return (
		<List>
			<MediaPreview withControls={false} />
			<NestedList>
				<AudioInputChooser withConfirm />
			</NestedList>
			<NestedList>
				<VideoInputChooser withConfirm />
				<BlurSwitch />
			</NestedList>
		</List>
	);
};

export default MediaSettings;