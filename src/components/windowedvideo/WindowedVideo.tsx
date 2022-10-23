import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { windowedConsumerSelector } from '../../store/selectors';
import { roomActions } from '../../store/slices/roomSlice';
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
							display: 'flex',
							width: '100%',
							height: '100%'
						}}
					>
						<VideoView consumer={consumer} contain />
					</VideoBox>
				</SeparateWindow>
			)}
		</>
	);
};

export default WindowedVideo;