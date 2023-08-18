import { useTheme } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import MicPreviewButton from '../controlbuttons/MicPreviewButton';
import WebcamPreviewButton from '../controlbuttons/WebcamPreviewButton';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';

interface MediaPreviewProps {
	withControls?: boolean;
}

const MediaPreview = ({
	withControls = true,
}: MediaPreviewProps): JSX.Element => {
	const theme = useTheme();
	const { previewWebcamTrackId } = useAppSelector((state) => state.media);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);

	return (
		<>
			<VideoBox sx={{
				paddingBottom: `${100 / aspectRatio}%`,
				marginTop: theme.spacing(1),
				marginBottom: theme.spacing(1)
			}}>
				{ withControls && (
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
						autoHide={false}
					>
						<MicPreviewButton
							onColor='default'
							offColor='error'
							disabledColor='default'
						/>
						<WebcamPreviewButton
							onColor='default'
							offColor='error'
							disabledColor='default'
						/>
					</MediaControls>
				)}
				{ previewWebcamTrackId && <VideoView
					preview
					mirrored
					trackId={previewWebcamTrackId}
				/> }
			</VideoBox>
		</>
	);
};

export default MediaPreview;