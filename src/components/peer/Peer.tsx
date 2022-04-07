import {
	useAppSelector,
	usePeerConsumers
} from '../../store/hooks';
import FullscreenVideoButton from '../controlbuttons/FullscreenVideoButton';
import WindowedVideoButton from '../controlbuttons/WindowedVideoButton';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';

interface PeerProps {
	key: string;
	id: string;
	spacing: number;
	style: Record<'width' | 'height', number>
}

const Peer = ({
	id,
	spacing,
	style
}: PeerProps): JSX.Element => {
	const hideNonVideo = useAppSelector((state) => state.settings.hideNonVideo);

	const {
		webcamConsumer,
		screenConsumer,
		extraVideoConsumers
	} = usePeerConsumers(id);

	const activeSpeaker =
		useAppSelector((state) => id === state.room.activeSpeakerId);

	const showParticipant = !hideNonVideo || (hideNonVideo && webcamConsumer);

	return (
		<>
			{ showParticipant && (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={1}
					margin={spacing}
					sx={{ ...style }}
				>
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						{ webcamConsumer && (
							<>
								<FullscreenVideoButton
									consumerId={webcamConsumer.id}
								/>
								<WindowedVideoButton
									consumerId={webcamConsumer.id}
								/>
							</>
						)}
					</MediaControls>
					{ webcamConsumer && <VideoView
						trackId={webcamConsumer.trackId}
					/> }
				</VideoBox>
			)}
			
			{ screenConsumer && (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={2}
					margin={spacing}
					sx={{ ...style }}
				>
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<FullscreenVideoButton consumerId={screenConsumer.id} />
						<WindowedVideoButton consumerId={screenConsumer.id} />
					</MediaControls>
					<VideoView
						trackId={screenConsumer.trackId}
						contain
					/>
				</VideoBox>
			)}
			{ extraVideoConsumers?.map((consumer) => (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={3}
					margin={spacing}
					key={consumer.trackId}
					sx={{ ...style }}
				>
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<FullscreenVideoButton consumerId={consumer.id} />
						<WindowedVideoButton consumerId={consumer.id} />
					</MediaControls>
					<VideoView
						trackId={consumer.trackId}
					/>
				</VideoBox>
			)) }
		</>
	);
};

export default Peer;