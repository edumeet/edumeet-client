import { Consumer } from 'mediasoup-client/lib/Consumer';
import { Producer } from 'mediasoup-client/lib/Producer';
import { useContext, useEffect, useRef } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { ServiceContext } from '../../store/store';

interface AudioViewProps {
	consumer?: StateConsumer;
}

const AudioView = ({
	consumer
}: AudioViewProps): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const audioElement = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		let media: Consumer | Producer | undefined;
		let track: MediaStreamTrack | null | undefined;

		if (consumer)
			media = mediaService.getConsumer(consumer.id);

		if (media)
			({ track } = media);

		if (!track || !audioElement?.current) return;

		const stream = new MediaStream();

		stream.addTrack(track);
		audioElement.current.srcObject = stream;
		audioElement.current.play().catch();

		return () => {
			if (audioElement.current) {
				audioElement.current.srcObject = null;
				audioElement.current.onplay = null;
				audioElement.current.onpause = null;
			}
		};
	}, []);

	return (
		<audio
			ref={audioElement}
			autoPlay
		/>
	);
};

export default AudioView;