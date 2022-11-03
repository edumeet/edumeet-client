import { useContext, useEffect, useRef } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { ServiceContext } from '../../store/store';

interface AudioViewProps {
	consumer: StateConsumer;
}

const AudioView = ({
	consumer
}: AudioViewProps): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const audioElement = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		const { track } = mediaService.getConsumer(consumer.id) ?? {};

		if (!track || !audioElement?.current) return;

		const { audioGain } = consumer;

		if (audioGain !== undefined)
			audioElement.current.volume = audioGain;

		const stream = new MediaStream();

		stream.addTrack(track);
		audioElement.current.srcObject = stream;

		return () => {
			if (audioElement.current) {
				audioElement.current.srcObject = null;
				audioElement.current.onplay = null;
				audioElement.current.onpause = null;
			}
		};
	}, []);

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