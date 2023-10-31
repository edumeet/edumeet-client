import { styled } from '@mui/material/styles';
import { Consumer } from 'mediasoup-client/lib/Consumer';
import { Producer } from 'mediasoup-client/lib/types';
import { useContext, useEffect, useRef } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { StateProducer } from '../../store/slices/producersSlice';
import { ServiceContext } from '../../store/store';
import { ResolutionWatcher } from '../../utils/resolutionWatcher';

interface VideoViewProps {
	mirrored?: boolean;
	contain?: boolean;
	trackId?: string;
	consumer?: StateConsumer;
	producer?: StateProducer;
	roundedCorners?: boolean;
}

interface VideoProps {
	mirrored?: number;
	contain?: number;
	roundedcorners?: number;
}

const StyledVideo = styled('video')<VideoProps>(({
	theme,
	mirrored,
	contain,
	roundedcorners,
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
	backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJsb2FkZXItMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI0MHB4IiBoZWlnaHQ9IjQwcHgiIHZpZXdCb3g9IjAgMCA1MCA1MCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAgNTA7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KCTxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik00My45MzUsMjUuMTQ1YzAtMTAuMzE4LTguMzY0LTE4LjY4My0xOC42ODMtMTguNjgzYy0xMC4zMTgsMC0xOC42ODMsOC4zNjUtMTguNjgzLDE4LjY4M2g0LjA2OGMwLTguMDcxLDYuNTQzLTE0LjYxNSwxNC42MTUtMTQuNjE1YzguMDcyLDAsMTQuNjE1LDYuNTQzLDE0LjYxNSwxNC42MTVINDMuOTM1eiI+CgkJPGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlVHlwZT0ieG1sIiBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIHR5cGU9InJvdGF0ZSIgZnJvbT0iMCAyNSAyNSIgdG89IjM2MCAyNSAyNSIgZHVyPSIwLjZzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSI+PC9hbmltYXRlVHJhbnNmb3JtPgoJPC9wYXRoPgo8L3N2Zz4K)',
	borderRadius: roundedcorners ? theme.roundedness : '0',
}));

const VideoView = ({
	mirrored,
	contain,
	trackId,
	consumer,
	producer,
	roundedCorners = true
}: VideoViewProps): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const videoElement = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		let media: Consumer | Producer | undefined;
		let track: MediaStreamTrack | null | undefined;

		if (trackId)
			track = mediaService.getTrack(trackId);
		else if (consumer)
			media = mediaService.getConsumer(consumer.id);
		else if (producer)
			media = mediaService.getProducer(producer.id);

		if (media)
			({ track } = media);

		if (!track || !videoElement.current) return;

		const stream = new MediaStream();
		
		stream.addTrack(track);
		videoElement.current.srcObject = stream;

		return () => {
			if (videoElement.current) {
				videoElement.current.srcObject = null;
				videoElement.current.onplay = null;
				videoElement.current.onpause = null;
			}
		};
	}, []);

	useEffect(() => {
		if (!consumer) return;

		const actualConsumer = mediaService.getConsumer(consumer.id);

		const resolutionWatcher = actualConsumer?.appData.resolutionWatcher as ResolutionWatcher | undefined;
		const resolutionReporter = resolutionWatcher?.createResolutionReporter();

		if (!resolutionReporter || !videoElement.current) return;

		const resizeObserver = new ResizeObserver((entries) => {
			const { contentRect: { width, height } } = entries[0];

			resolutionReporter.updateResolution({ width, height });
		});

		resizeObserver.observe(videoElement.current);

		return () => {
			resizeObserver.disconnect();
			resolutionReporter.close();
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
			roundedcorners={roundedCorners ? 1 : 0}
		/>
	);
};

export default VideoView;