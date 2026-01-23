import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { windowedConsumersSelector } from '../../store/selectors';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import SeparateWindow from '../separatewindow/SeparateWindow';
import { roomSessionsActions } from '../../store/slices/roomSessionsSlice';
import { useEffect, useState } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';

const WindowedVideo = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const sessionId = useAppSelector((state) => state.me.sessionId);
	const consumers = useAppSelector(windowedConsumersSelector);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);

	const [ consumersToRender, setConsumersToRender ] = useState<StateConsumer[]>(consumers);

	useEffect(() => {
		setTimeout(() => setConsumersToRender(consumers), 0);
	}, [ consumers ]);

	return (
		<>
			{ consumersToRender.map((consumer) => (
				<SeparateWindow
					key={consumer.id}
					onClose={() => dispatch(roomSessionsActions.removeWindowedConsumer({ sessionId, consumerId: consumer.id }))}
					aspectRatio={aspectRatio}
				>
					<VideoBox
						roundedCorners={false}
						sx={{
							display: 'flex',
							width: '100%',
							height: '100%'
						}}
					>
						<VideoView consumer={consumer} contain roundedCorners={false} />
					</VideoBox>
				</SeparateWindow>
			))}
		</>
	);
};

export default WindowedVideo;