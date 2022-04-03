import { useTheme } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import MicPreviewButton from '../controlbuttons/MicPreviewButton';
import WebcamPreviewButton from '../controlbuttons/WebcamPreviewButton';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';

const MediaPreview = (): JSX.Element => {
	const theme = useTheme();
	const previewWebcamTrackId = useAppSelector((state) => state.me.previewWebcamTrackId);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);

	return (
		<>
			<VideoBox sx={{
				width: '100%',
				paddingBottom: `${100 / aspectRatio}%`,
				height: '100%',
				marginTop: theme.spacing(1),
				marginBottom: theme.spacing(1)
			}}>
				<MediaControls
					orientation='vertical'
					horizontalPlacement='right'
					verticalPlacement='center'
				>
					<MicPreviewButton onColor='default' offColor='error' disabledColor='default' />
					<WebcamPreviewButton onColor='default' offColor='error' disabledColor='default' />
				</MediaControls>
				{ previewWebcamTrackId && <VideoView
					mirrored={true} // TODO
					trackId={previewWebcamTrackId}
				/> }
			</VideoBox>
		</>
	);
};

export default MediaPreview;