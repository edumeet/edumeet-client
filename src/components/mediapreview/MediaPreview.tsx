import { useEffect } from 'react';
import { useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import MicPreviewButton from '../controlbuttons/MicPreviewButton';
import WebcamPreviewButton from '../controlbuttons/WebcamPreviewButton';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import { stopPreviewMic, stopPreviewWebcam, updatePreviewMic, updatePreviewWebcam } from '../../store/actions/mediaActions';

interface MediaPreviewProps {
	withControls?: boolean;
	startAudio?: boolean;
	startVideo?: boolean;
	stopAudio?: boolean;
	stopVideo?: boolean;
	updateSelection?: boolean;
}

const MediaPreview = ({
	withControls = true,
	startAudio = true,
	startVideo = true,
	stopAudio = true,
	stopVideo = true,
	updateSelection = false
}: MediaPreviewProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const previewWebcamTrackId = useAppSelector((state) => state.me.previewWebcamTrackId);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);
	const audioDevice = useAppSelector((state) => state.settings.selectedAudioDevice);
	const videoDevice = useAppSelector((state) => state.settings.selectedVideoDevice);

	useEffect(() => {
		if (startAudio) dispatch(updatePreviewMic({ start: true, newDeviceId: audioDevice, updateSelection }));
		if (startVideo) dispatch(updatePreviewWebcam({ start: true, newDeviceId: videoDevice, updateSelection }));

		return (): void => {
			if (stopAudio) dispatch(stopPreviewMic());
			if (stopVideo) dispatch(stopPreviewWebcam());
		};
	}, []);

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
				{ previewWebcamTrackId && <VideoView mirrored previewTrack /> }
			</VideoBox>
		</>
	);
};

export default MediaPreview;
