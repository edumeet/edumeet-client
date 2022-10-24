import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { windowedConsumersSelector } from '../../store/selectors';
import { roomActions } from '../../store/slices/roomSlice';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import SeparateWindow from '../separatewindow/SeparateWindow';

const WindowedVideo = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const consumers = useAppSelector(windowedConsumersSelector);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);

	return (
		<>
			{ consumers.map((consumer) => (
				<SeparateWindow
					key={consumer.id}
					onClose={() => dispatch(roomActions.removeWindowedConsumer(consumer.id))}
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
			))}
		</>
	);
};

export default WindowedVideo;