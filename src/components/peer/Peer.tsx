import { useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { makePeerConsumerSelector } from '../../store/selectors';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';

interface PeerProps {
	key: string;
	id: string;
	spacing: number;
	style: Record<'width' | 'height', number>
}

const Peer = ({
	id,
	spacing,
	style
}: PeerProps): JSX.Element => {
	const getPeerConsumers =
		useMemo(() => makePeerConsumerSelector(id), []);

	const {
		webcamConsumer,
		screenConsumer,
		extraVideoConsumers
	} = useAppSelector(getPeerConsumers);

	const activeSpeaker =
		useAppSelector((state) => id === state.room.activeSpeakerId);

	return (
		<>
			<VideoBox
				activeSpeaker={activeSpeaker}
				order={1}
				margin={spacing}
				sx={{ ...style }}
			>
				<MediaControls
					orientation='vertical'
					horizontalPlacement='right'
					verticalPlacement='center'
				/>
				{ webcamConsumer && <VideoView
					trackId={webcamConsumer.trackId}
				/> }
			</VideoBox>
			{ screenConsumer && (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={2}
					margin={spacing}
					sx={{ ...style }}
				>
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					/>
					<VideoView trackId={screenConsumer.trackId} />
				</VideoBox>
			)}
			{ extraVideoConsumers?.map((consumer) => (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={3}
					margin={spacing}
					key={consumer.trackId}
					sx={{ ...style }}
				>
					<VideoView
						trackId={consumer.trackId}
					/>
				</VideoBox>
			)) }
		</>
	);
};

export default Peer;