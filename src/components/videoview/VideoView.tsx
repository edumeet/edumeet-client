import { styled } from '@mui/material/styles';
import { Consumer } from 'mediasoup-client/lib/Consumer';
import { Producer } from 'mediasoup-client/lib/Producer';
import { useContext, useEffect, useRef } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { StateProducer } from '../../store/slices/producersSlice';
import { ServiceContext } from '../../store/store';
import { ResolutionWatcher } from '../../utils/resolutionWatcher';

interface VideoViewProps {
	mirrored?: boolean;
	contain?: boolean;
	zIndex?: number;
	trackId?: string;
	consumer?: StateConsumer;
	producer?: StateProducer;
	roundedCorners?: boolean;
	preview?: boolean
}

interface VideoProps {
	mirrored?: number;
	contain?: number;
	zindex?: number;
	roundedcorners?: number;
}

const StyledVideo = styled('video')<VideoProps>(({
	theme,
	mirrored,
	contain,
	zindex = 0,
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
	zIndex: zindex,
	borderRadius: roundedcorners ? theme.roundedness : '0',
}));

const VideoView = ({
	mirrored,
	contain,
	zIndex,
	trackId,
	consumer,
	producer,
	roundedCorners = true,
	preview = false
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
		else if (preview && trackId)
			track = mediaService.getTrack(trackId, 'previewTracks');

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
	}, [ trackId, consumer, producer ]);

	useEffect(() => {
		if (!consumer)
			return;

		const actualConsumer = mediaService.getConsumer(consumer.id);
		
		if (!actualConsumer)
			return;

		const {
			resolutionWatcher
		}: {
			resolutionWatcher?: ResolutionWatcher
		} = actualConsumer.appData;

		const resolutionReporter = resolutionWatcher?.createResolutionReporter();

		if (!resolutionReporter || !videoElement.current)
			return;

		const resizeObserver = new ResizeObserver((entries) => {
			const {
				contentRect: {
					width,
					height
				}
			} = entries[0];

			resolutionReporter.updateResolution({ width, height });
		});

		resizeObserver.observe(videoElement.current);

		return () => {
			resizeObserver.disconnect();
			resolutionReporter.close();
		};
	}, [ consumer ]);

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
			zindex={zIndex}
		/>
	);
};

export default VideoView;