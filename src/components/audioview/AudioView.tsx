import { useContext, useEffect, useRef } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { ServiceContext } from '../../store/store';
import { HTMLMediaElementWithSink } from '../../utils/types';

interface AudioViewProps {
	consumer: StateConsumer;
	deviceId?: string;
}

const AudioView = ({
	consumer,
	deviceId
}: AudioViewProps): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const audioElement = useRef<HTMLMediaElementWithSink>(null);

	useEffect(() => {
		const { track } = mediaService.getConsumer(consumer.id) ?? {};

		if (!track || !audioElement?.current) return;

		const { audioGain } = consumer;

		if (audioGain !== undefined)
			audioElement.current.volume = audioGain;

		const stream = new MediaStream();

		stream.addTrack(track);
		audioElement.current.srcObject = stream;

		if (deviceId) {
			audioElement.current.setSinkId(deviceId);
		}

		return () => {
			if (audioElement.current) {
				audioElement.current.srcObject = null;
				audioElement.current.onplay = null;
				audioElement.current.onpause = null;
			}
		};
	}, [ deviceId, consumer.id, ]);

	useEffect(() => {
		const { audioGain } = consumer;

		if (audioGain !== undefined && audioElement.current)
			audioElement.current.volume = audioGain;
	}, [ consumer.audioGain ]);

	return (
		<audio
			ref={audioElement}
			autoPlay
		/>
	);
};

export default AudioView;