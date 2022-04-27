import { styled } from '@mui/material/styles';
import { Consumer } from 'mediasoup-client/lib/Consumer';
import { Producer } from 'mediasoup-client/lib/Producer';
import { useContext, useEffect, useRef } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { StateProducer } from '../../store/slices/producersSlice';
import { ServiceContext } from '../../store/store';

interface VideoViewProps {
	mirrored?: boolean;
	contain?: boolean;
	zIndex?: number;
	trackId?: string;
	consumer?: StateConsumer;
	producer?: StateProducer;
}

const StyledVideo = styled('video')({
	position: 'absolute',
	height: '100%',
	width: '100%',
	objectFit: 'cover',
	userSelect: 'none',
	backgroundColor: 'rgba(19, 19, 19, 1)'
});

const VideoView = ({
	mirrored,
	contain,
	zIndex,
	trackId,
	consumer,
	producer
}: VideoViewProps): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const videoElement = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		let media: Consumer | Producer | undefined;
		let track: MediaStreamTrack | null | undefined;

		if (consumer) {
			media = mediaService.getConsumer(consumer.id);
		} else if (producer) {
			media = mediaService.getProducer(producer.id);
		}

		if (media) {
			({ track } = media);
		} else if (trackId) {
			track = mediaService.getTrack(trackId);
		}

		if (!track || !videoElement?.current) return;

		const stream = new MediaStream();

		stream.addTrack(track);
		videoElement.current.srcObject = stream;
		videoElement.current.play().catch();

		return () => {
			if (videoElement.current) {
				videoElement.current.srcObject = null;
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
				...(contain && {
					objectFit: 'contain'
				}),
				zIndex
			}}
		/>
	);
};

export default VideoView;