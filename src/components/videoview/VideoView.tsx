import { styled } from '@mui/material/styles';
import { useContext, useEffect, useRef } from 'react';
import { MediaServiceContext } from '../../store/store';

interface VideoViewProps {
	mirrored?: boolean;
	trackId: string;
}

const StyledVideo = styled('video')({
	position: 'absolute',
	height: '100%',
	width: '100%',
	objectFit: 'cover',
	userSelect: 'none',
	// backgroundColor: 'var(--peer-video-bg-color)', TODO: add this back in
});

const VideoView = ({
	mirrored,
	trackId
}: VideoViewProps): JSX.Element => {
	const mediaService = useContext(MediaServiceContext);
	const videoElement = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const track = mediaService.getTrack(trackId);

		if (!track || !videoElement?.current) return;

		const stream = new MediaStream();

		stream.addTrack(track);
		videoElement.current.srcObject = stream;
		videoElement.current.play().catch();

		return () => {
			if (videoElement.current) {
				videoElement.current.onplay = null;
				videoElement.current.onpause = null;
			}
		};
	}, []);

	return (
		<StyledVideo
			ref={videoElement}
			autoPlay
			playsInline
			muted
			controls={false}
			sx={{
				...(mirrored && {
					transform: 'scaleX(-1)'
				}),
			}}
		/>
	);
};

export default VideoView;