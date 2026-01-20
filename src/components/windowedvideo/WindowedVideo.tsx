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
	const contain = useAppSelector((state) => state.settings.videoContainEnabled);

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
					{/* Full window container */}
					<Box
						sx={{
							width: '100vw',
							height: '100vh',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							bgcolor: 'black',
						}}
					>
						{/* Fixed-aspect-ratio box */}
						<Box
							sx={{
								position: 'relative',
								width: '100%',
								height: '100%',
								maxWidth: '100%',
								maxHeight: '100%',
								aspectRatio: aspectRatio,
							}}
						>
							<VideoBox
								roundedCorners={false}
								position='relative'
								width='100%'
								height='100%'
								sx={{
									display: 'flex',
									width: '100%',
									height: 'auto'
								}}
							>
								<VideoView consumer={consumer} contain={contain} roundedCorners={false} />
							</VideoBox>
						</Box>
					</Box>
				</SeparateWindow>
			))}
		</>
	);
};

export default WindowedVideo;