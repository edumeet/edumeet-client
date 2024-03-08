import {
	useAppSelector,
	usePeer,
	usePeerConsumers
} from '../../store/hooks';
import { activeSpeakerIdSelector, isMobileSelector } from '../../store/selectors';
import { StateConsumer } from '../../store/slices/consumersSlice';
import FullscreenVideoButton from '../controlbuttons/FullscreenVideoButton';
import WindowedVideoButton from '../controlbuttons/WindowedVideoButton';
import DisplayName from '../displayname/DisplayName';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import Volume from '../volume/Volume';

interface VideoConsumerProps {
	consumer: StateConsumer;
	style: Record<'width' | 'height', number>
}

const VideoConsumer = ({ consumer, style }: VideoConsumerProps): JSX.Element => {
	const { peerId, source } = consumer;
	const { micConsumer } = usePeerConsumers(peerId);
	const peer = usePeer(peerId);
	const contain = source === 'screen';

	const isMobile = useAppSelector(isMobileSelector);
	const activeSpeaker = useAppSelector(activeSpeakerIdSelector) === peerId;
	const headless = useAppSelector((state) => state.room.headless);

	return (
		<VideoBox
			activeSpeaker={activeSpeaker}
			order={1}
			width={style.width}
			height={style.height}
		>
			<VideoView consumer={consumer} contain={contain} />
			{ micConsumer && <Volume consumer={micConsumer} /> }
			{ !headless &&
				<>
					<DisplayName displayName={peer?.displayName} peerId={peerId} />
					<MediaControls
						orientation='horizontal'
						horizontalPlacement='center'
						verticalPlacement='center'
					>
						<FullscreenVideoButton consumerId={consumer.id} toolTipLocation='bottom' />
						{ !isMobile && <WindowedVideoButton consumerId={consumer.id} toolTipLocation='bottom' /> }
					</MediaControls>
				</>
			}
		</VideoBox>
	);
};

export default VideoConsumer;
