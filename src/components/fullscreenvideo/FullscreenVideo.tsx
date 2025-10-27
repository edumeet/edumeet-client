import { useAppSelector } from '../../store/hooks';
import { fullscreenConsumerSelector } from '../../store/selectors';
import FullscreenVideoButton from '../controlbuttons/FullscreenVideoButton';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';

const FullscreenVideo = (): React.JSX.Element => {
	const consumer = useAppSelector(fullscreenConsumerSelector);

	return (
		<>
			{ consumer && (
				<VideoBox
					position='absolute'
					roundedCorners={false}
					width={'100%'}
					height={'100%'}
				>
					<VideoView consumer={consumer} contain roundedCorners={false} />
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<FullscreenVideoButton consumerId={consumer.id} />
					</MediaControls>
				</VideoBox>
			)}
		</>
	);
};

export default FullscreenVideo;