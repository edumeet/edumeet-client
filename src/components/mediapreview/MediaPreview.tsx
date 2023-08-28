import { useTheme } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import MicPreviewButton from '../controlbuttons/MicPreviewButton';
import WebcamPreviewButton from '../controlbuttons/WebcamPreviewButton';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Volume from '../volume/Volume';

interface MediaPreviewProps {
	withControls?: boolean;
}

const MediaPreview = ({
	withControls = true,
}: MediaPreviewProps): JSX.Element => {
	const theme = useTheme();
	const { mediaService } = useContext(ServiceContext);
	const { previewWebcamTrackId } = useAppSelector((state) => state.media);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);
	const previewVolumeWatcher = mediaService.previewVolumeWatcher;

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
				{previewVolumeWatcher && <Volume previewVolumeWatcher={previewVolumeWatcher} />}
			</VideoBox>
		</>
	);
};

export default MediaPreview;