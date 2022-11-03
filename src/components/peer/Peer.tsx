import {
	useAppSelector,
	usePeer,
	usePeerConsumers
} from '../../store/hooks';
import FullscreenVideoButton from '../controlbuttons/FullscreenVideoButton';
import PeerActionsButton from '../controlbuttons/PeerActionsButton';
import WindowedVideoButton from '../controlbuttons/WindowedVideoButton';
import DisplayName from '../displayname/DisplayName';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import Volume from '../volume/Volume';

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
	const {
		micConsumer,
		webcamConsumer,
		screenConsumer,
		extraVideoConsumers
	} = usePeerConsumers(id);
	const hideNonVideo = useAppSelector((state) => state.settings.hideNonVideo);
	const peer = usePeer(id);
	const activeSpeaker = useAppSelector((state) => id === state.room.activeSpeakerId);
	const showParticipant = !hideNonVideo || (hideNonVideo && webcamConsumer);

	return (
		<>
			{ showParticipant && (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={1}
					margin={spacing}
					width={style.width}
					height={style.height}
				>
					<DisplayName displayName={peer?.displayName} />
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
						<PeerActionsButton peerId={id} />
					</MediaControls>
					{ micConsumer && <Volume consumer={micConsumer} /> }
					{ webcamConsumer && <VideoView
						consumer={webcamConsumer}
					/> }
				</VideoBox>
			)}
			
			{ screenConsumer && (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={2}
					margin={spacing}
					width={style.width}
					height={style.height}
				>
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<FullscreenVideoButton consumerId={screenConsumer.id} />
						<WindowedVideoButton consumerId={screenConsumer.id} />
					</MediaControls>
					<VideoView consumer={screenConsumer} contain />
				</VideoBox>
			)}
			{ extraVideoConsumers?.map((consumer) => (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={3}
					margin={spacing}
					key={consumer.id}
					width={style.width}
					height={style.height}
				>
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<FullscreenVideoButton consumerId={consumer.id} />
						<WindowedVideoButton consumerId={consumer.id} />
					</MediaControls>
					<VideoView consumer={consumer} />
				</VideoBox>
			)) }
		</>
	);
};

export default Peer;