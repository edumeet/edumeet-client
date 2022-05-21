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

interface VideoProps {
	mirrored?: number;
	contain?: number;
	zindex?: number;
}

const StyledVideo = styled('video')<VideoProps>(({
	mirrored,
	contain,
	zindex
}) => ({
	position: 'absolute',
	height: '100%',
	width: '100%',
	...(mirrored && {
		transform: 'scaleX(-1)'
	}),
	objectFit: contain ? 'contain' : 'cover',
	userSelect: 'none',
	backgroundColor: 'rgba(19, 19, 19, 1)',
	backgroundRepeat: 'no-repeat',
	backgroundPosition: 'center center',
	backgroundImage: `url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJsb2F
					kZXItMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bG
					luaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiI
					HdpZHRoPSI0MHB4IiBoZWlnaHQ9IjQwcHgiIHZpZXdCb3g9IjAgMCA1MCA1MCIgc3R5
					bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAgNTA7IiB4bWw6c3BhY2U9InB
					yZXNlcnZlIj4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik00My45MzUsMjUuMTQ1YzAtMT
					AuMzE4LTguMzY0LTE4LjY4My0xOC42ODMtMTguNjgzYy0xMC4zMTgsMC0xOC42ODMsO
					C4zNjUtMTguNjgzLDE4LjY4M2g0LjA2OGMwLTguMDcxLDYuNTQzLTE0LjYxNSwxNC42
					MTUtMTQuNjE1YzguMDcyLDAsMTQuNjE1LDYuNTQzLDE0LjYxNSwxNC42MTVINDMuOTM
					1eiI+CgkJPGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlVHlwZT0ieG1sIiBhdHRyaW
					J1dGVOYW1lPSJ0cmFuc2Zvcm0iIHR5cGU9InJvdGF0ZSIgZnJvbT0iMCAyNSAyNSIgd
					G89IjM2MCAyNSAyNSIgZHVyPSIwLjZzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSI+
					PC9hbmltYXRlVHJhbnNmb3JtPgoJPC9wYXRoPgo8L3N2Zz4K)`,
	zIndex: zindex ? zindex : 0
}));

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

		if (consumer)
			media = mediaService.getConsumer(consumer.id);
		else if (producer)
			media = mediaService.getProducer(producer.id);

		if (media)
			({ track } = media);
		else if (trackId)
			track = mediaService.getTrack(trackId);

		if (!track || !videoElement.current) return;

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

	// Props workaround for: https://github.com/mui/material-ui/issues/25925
	return (
		<StyledVideo
			ref={videoElement}
			autoPlay
			playsInline
			muted
			controls={false}
			mirrored={mirrored ? 1 : 0}
			contain={contain ? 1 : 0}
			zindex={zIndex ? zIndex : 0}
		/>
	);
};

export default VideoView;