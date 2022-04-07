import AudioInputChooser from '../devicechooser/AudioInputChooser';
import VideoInputChooser from '../devicechooser/VideoInputChooser';
import MediaPreview from '../mediapreview/MediaPreview';

const MediaSettings = (): JSX.Element => {
	return (
		<>
			<MediaPreview withControls={false} />
			<AudioInputChooser preview withConfirm />
			<VideoInputChooser preview withConfirm />
		</>
	);
};

export default MediaSettings;