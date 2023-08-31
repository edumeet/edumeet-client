import {
	useAppSelector,
	useIsActiveSpeaker,
	usePeer,
	usePeerConsumers
} from '../../store/hooks';
import { isMobileSelector } from '../../store/selectors';
import FullscreenVideoButton from '../controlbuttons/FullscreenVideoButton';
import PeerActionsButton from '../controlbuttons/PeerActionsButton';
import WindowedVideoButton from '../controlbuttons/WindowedVideoButton';
import DisplayName from '../displayname/DisplayName';
import MediaControls from '../mediacontrols/MediaControls';
import PeerStatsView from '../peerstatsview/PeerStatsView';
import PeerTranscription from '../peertranscription/PeerTranscription';
import RTPQuality from '../rtpquality/RtpQuality';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import Volume from '../volume/Volume';

interface PeerProps {
	key: string;
	id: string;
	style: Record<'width' | 'height', number>
}

const Peer = ({
	id,
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
	const isActiveSpeaker = useIsActiveSpeaker(id);
	const showParticipant = !hideNonVideo || (hideNonVideo && webcamConsumer);
	const showStats = useAppSelector((state) => state.ui.showStats);
	const isMobile = useAppSelector(isMobileSelector);
	const score = webcamConsumer?.score ?? micConsumer?.score;

	return (
		<>
			{ showParticipant && (
				<VideoBox
					activeSpeaker={isActiveSpeaker}
					order={1}
					width={style.width}
					height={style.height}
					zIndex={0}
				>
					<DisplayName displayName={peer?.displayName} peerId={id} />
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						{ webcamConsumer && (
							<>
								<FullscreenVideoButton consumerId={webcamConsumer.id} />
								{ !isMobile && <WindowedVideoButton consumerId={webcamConsumer.id} /> }
							</>
						)}
						<PeerActionsButton peerId={id} />
					</MediaControls>
					<PeerTranscription id={id} />
					{ micConsumer && <Volume consumer={micConsumer} /> }
					{typeof score === 'number' && score < 10 && <RTPQuality score={score} />}
					{ webcamConsumer && <VideoView consumer={webcamConsumer} /> }
					{ webcamConsumer && showStats && <PeerStatsView consumerId={webcamConsumer.id}/> }
				</VideoBox>
			)}
			
			{ screenConsumer && (
				<VideoBox
					activeSpeaker={isActiveSpeaker}
					order={2}
					width={style.width}
					height={style.height}
				>
					<DisplayName displayName={peer?.displayName} peerId={id} />
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<FullscreenVideoButton consumerId={screenConsumer.id} />
						{ !isMobile && <WindowedVideoButton consumerId={screenConsumer.id} /> }
					</MediaControls>
					<VideoView consumer={screenConsumer} contain />
					{ showStats && <PeerStatsView consumerId={screenConsumer.id}/> }
				</VideoBox>
			)}
			{ extraVideoConsumers?.map((consumer) => (
				<VideoBox
					activeSpeaker={isActiveSpeaker}
					order={3}
					key={consumer.id}
					width={style.width}
					height={style.height}
				>
					<DisplayName displayName={peer?.displayName} peerId={id} />
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<FullscreenVideoButton consumerId={consumer.id} />
						{ !isMobile && <WindowedVideoButton consumerId={consumer.id} /> }
					</MediaControls>
					<VideoView consumer={consumer} />
					{ showStats && <PeerStatsView consumerId={consumer.id}/> }
				</VideoBox>
			)) }
		</>
	);
};

export default Peer;