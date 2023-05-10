import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { windowedConsumersSelector } from '../../store/selectors';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import SeparateWindow from '../separatewindow/SeparateWindow';
import { roomSessionsActions } from '../../store/slices/roomSessionsSlice';

const WindowedVideo = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const sessionId = useAppSelector((state) => state.me.sessionId);
	const consumers = useAppSelector(windowedConsumersSelector);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);

	return (
		<>
			{ consumers.map((consumer) => (
				<SeparateWindow
					key={consumer.id}
					onClose={() => dispatch(roomSessionsActions.removeWindowedConsumer({ sessionId, consumerId: consumer.id }))}
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