import { useAppSelector } from '../../store/hooks';
import { fullscreenConsumerSelector } from '../../store/selectors';
import FullscreenVideoButton from '../controlbuttons/FullscreenVideoButton';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';

const FullscreenVideo = (): JSX.Element => {
	const consumer = useAppSelector(fullscreenConsumerSelector);

	return (
		<>
			{ consumer && (
				<VideoBox
					position='absolute'
					zIndex={100}
					sx={{
						width: '100%',
						height: '100%',
					}}
				>
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<FullscreenVideoButton
							consumerId={consumer.id}
						/>
					</MediaControls>
					<VideoView consumer={consumer} contain />
				</VideoBox>
			)}
		</>
	);
};

export default FullscreenVideo;