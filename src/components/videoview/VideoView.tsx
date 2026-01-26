import { styled } from '@mui/material/styles';
import type { Consumer } from 'mediasoup-client/lib/Consumer';
import { useContext, useEffect, useRef, useState } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { ServiceContext } from '../../store/store';
import { ResolutionWatcher } from '../../utils/resolutionWatcher';
import type { Consumer as PeerConsumer } from 'ortc-p2p/src/types';
import { ProducerSource } from '../../utils/types';
import { useAppSelector } from '../../store/hooks';
import { Logger } from '../../utils/Logger';

const logger = new Logger('VideoView');

interface VideoViewProps {
	mirrored?: boolean;
	contain?: boolean;
	consumer?: StateConsumer;
	source?: ProducerSource;
	previewTrack?: boolean;
	roundedCorners?: boolean;
}

interface VideoProps {
	mirrored?: number;
	contain?: number;
	roundedcorners?: number;
	loading?: number;
}

const StyledVideo = styled('video')<VideoProps>(({
	theme,
	mirrored,
	contain,
	roundedcorners,
	loading,
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
	...(loading && {
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center center',
		backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJsb2FkZXItMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI0MHB4IiBoZWlnaHQ9IjQwcHgiIHZpZXdCb3g9IjAgMCA1MCA1MCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAgNTA7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KCTxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik00My45MzUsMjUuMTQ1YzAtMTAuMzE4LTguMzY0LTE4LjY4My0xOC42ODMtMTguNjgzYy0xMC4zMTgsMC0xOC42ODMsOC4zNjUtMTguNjgzLDE4LjY4M2g0LjA2OGMwLTguMDcxLDYuNTQzLTE0LjYxNSwxNC42MTUtMTQuNjE1YzguMDcyLDAsMTQuNjE1LDYuNTQzLDE0LjYxNSwxNC42MTVINDMuOTM1eiI+CgkJPGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlVHlwZT0ieG1sIiBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIHR5cGU9InJvdGF0ZSIgZnJvbT0iMCAyNSAyNSIgdG89IjM2MCAyNSAyNSIgZHVyPSIwLjZzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSI+PC9hbmltYXRlVHJhbnNmb3JtPgoJPC9wYXRoPgo8L3N2Zz4K)',
	}),
	borderRadius: roundedcorners ? theme.roundedness : '0',
}));

const VideoView = ({
	mirrored,
	contain,
	consumer,
	source,
	previewTrack,
	roundedCorners = true
}: VideoViewProps): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const videoElement = useRef<HTMLVideoElement>(null);
	const [ loading, setLoading ] = useState(true);
	const previewWebcamTrackId = useAppSelector((state) => state.me.previewWebcamTrackId);
	const extraVideoTrackId = useAppSelector((state) => state.me.extraVideoTrackId);

	const previewTrackId =
		previewTrack ? previewWebcamTrackId : undefined;

	const senderTrackId =
		source === 'extravideo' ? extraVideoTrackId : undefined;

	useEffect(() => {
		const consumerId = consumer?.id;
		const currentVideoElement = videoElement.current;

		let media: Consumer | PeerConsumer | undefined;
		let track: MediaStreamTrack | null = null;

		if (previewTrack)
			track = mediaService.previewWebcamTrack;
		else if (source)
			track = mediaService.mediaSenders[source].track;
		else if (consumerId)
			media = mediaService.getConsumer(consumerId);

		if (media) ({ track } = media);

		if (consumerId)
			logger.debug('[VideoView] effect', {
				consumerId,
				localPaused: consumer?.localPaused,
				remotePaused: consumer?.remotePaused,
				hasMedia: Boolean(media),
				hasTrack: Boolean(track),
			});

		if (!track || !currentVideoElement) return;

		const stream = new MediaStream();

		stream.addTrack(track);
		currentVideoElement.srcObject = stream;

		if (currentVideoElement.readyState >= currentVideoElement.HAVE_METADATA)
			setLoading(false);
		else
			currentVideoElement.oncanplay = () => setLoading(false);

		return () => {
			if (currentVideoElement) {
				currentVideoElement.srcObject = null;
				currentVideoElement.oncanplay = null;
			}
		};
	}, [
		previewTrack,
		source,
		consumer?.id,
		consumer?.localPaused,
		consumer?.remotePaused,
		previewTrackId,
		senderTrackId,
	]);

	useEffect(() => {
		const consumerId = consumer?.id;

		if (!consumerId) return;

		const actualConsumer = mediaService.getConsumer(consumerId);
		const resolutionWatcher = actualConsumer?.appData.resolutionWatcher as ResolutionWatcher | undefined;
		const resolutionReporter = resolutionWatcher?.createResolutionReporter();
		const currentVideoElement = videoElement.current;

		if (!resolutionReporter || !currentVideoElement) return;

		const resizeObserver = new ResizeObserver((entries) => {
			const { contentRect: { width, height } } = entries[0];

			resolutionReporter.updateResolution({ width, height });
		});

		resizeObserver.observe(currentVideoElement);

		return () => {
			resizeObserver.disconnect();
			resolutionReporter.close();
		};
	}, [ consumer?.id ]);

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
			loading={loading ? 1 : 0}
		/>
	);
};

export default VideoView;
