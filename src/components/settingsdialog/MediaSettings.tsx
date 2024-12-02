import { List, styled } from '@mui/material';
import AudioInputChooser from '../devicechooser/AudioInputChooser';
import VideoInputChooser from '../devicechooser/VideoInputChooser';
import MediaPreview from '../mediapreview/MediaPreview';
import { useAppSelector } from '../../store/hooks';
import { canSelectAudioOutput } from '../../store/selectors';
import AudioOutputChooser from '../devicechooser/AudioOutputChooser';

const NestedList = styled(List)(({ theme }) => ({
	padding: theme.spacing(0, 1.5)
}));

const MediaSettings = (): JSX.Element => {
	const showAudioOutputChooser = useAppSelector(canSelectAudioOutput);

	return (
		<List>
			<MediaPreview withControls={false} />
			<NestedList>
				<AudioInputChooser withConfirm />
				{showAudioOutputChooser && <AudioOutputChooser /> }
			</NestedList>
			<NestedList>
				<VideoInputChooser withConfirm />
			</NestedList>
		</List>
	);
};

export default MediaSettings;