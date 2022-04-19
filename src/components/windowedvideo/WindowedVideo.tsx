import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { windowedConsumerSelector } from '../../store/selectors';
import { roomActions } from '../../store/slices/roomSlice';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import SeparateWindow from '../separatewindow/SeparateWindow';

const WindowedVideo = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const consumer = useAppSelector(windowedConsumerSelector);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);

	return (
		<>
			{ consumer && (
				<SeparateWindow
					onClose={() => dispatch(roomActions.setWindowedConsumer())}
					aspectRatio={aspectRatio}
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
						<VideoView consumer={consumer} contain />
					</VideoBox>
				</SeparateWindow>
			)}
		</>
	);
};

export default WindowedVideo;