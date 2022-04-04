import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { windowedConsumerSelector } from '../../store/selectors';
import { roomActions } from '../../store/slices/roomSlice';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import VideoWindow from '../videowindow/VideoWindow';

const WindowedVideo = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const consumer = useAppSelector(windowedConsumerSelector);

	return (
		<>
			{ consumer && (
				<VideoWindow
					onClose={() => dispatch(roomActions.setWindowedConsumer())}
				>
					<VideoBox
						sx={{
							position: 'absolute',
							width: '100%',
							height: '100%'
						}}
					>
						<MediaControls
							orientation='vertical'
							horizontalPlacement='right'
							verticalPlacement='center'
						/>
						<VideoView trackId={consumer.trackId} contain />
					</VideoBox>
				</VideoWindow>
			)}
		</>
	);
};

export default WindowedVideo;