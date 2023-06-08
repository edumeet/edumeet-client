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
					roundedCorners={false}
					sx={{
						paddingTop: '56px',
						width: '100%',
						height: 'calc(100% - 56px)',
						backgroundColor: 'transparent',
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
					<VideoView consumer={consumer} contain roundedCorners={false} />
				</VideoBox>
			)}
		</>
	);
};

export default FullscreenVideo;