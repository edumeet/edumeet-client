import { useContext, useEffect, useRef } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { ServiceContext } from '../../store/store';
import { HTMLMediaElementWithSink } from '../../utils/types';
import { Logger } from 'edumeet-common';
import { useAppSelector } from '../../store/hooks';

const logger = new Logger('AudioView');

interface AudioViewProps {
	consumer: StateConsumer;
	deviceId?: string
}

const AudioView = ({
	consumer,
	deviceId
}: AudioViewProps): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const ctx = mediaService.audioContext;
	const audioElement = useRef<HTMLMediaElementWithSink>(null);
	const deviceOs = useAppSelector((state) => state.me.browser.os);

	useEffect(() => {
		const { track } = mediaService.getConsumer(consumer.id) ?? {};

		if (!track || !audioElement?.current) return;

		const { audioGain } = consumer;

		if (audioGain !== undefined)
			audioElement.current.volume = audioGain;

		const stream = new MediaStream();

		stream.addTrack(track);

		// Unlock audio on ios.

		if (deviceOs === 'ios' && ctx) {
			const src = ctx.createMediaStreamSource(stream);

			src.connect(ctx.destination);
		}
		audioElement.current.srcObject = stream;

		if (deviceId && audioElement.current) {
			audioElement.current.setSinkId(deviceId).catch((e) => logger.error(e));
		}

		return () => {
			if (audioElement.current) {
				audioElement.current.srcObject = null;
				audioElement.current.onplay = null;
				audioElement.current.onpause = null;
			}
		};
	}, [ ctx, deviceId ]);

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