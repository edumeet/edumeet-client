import { useContext, useEffect, useRef } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { ServiceContext } from '../../store/store';
import { HTMLMediaElementWithSink } from '../../utils/types';
import { Logger } from '../../utils/Logger';

const logger = new Logger('AudioView');

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
		const mediaConsumer = mediaService.getConsumer(consumer.id);
		const currentAudioElement = audioElement.current;

		if (!currentAudioElement) {
			logger.warn('AudioView: audio element ref not ready %O',
				{
					consumerId: consumer.id,
					peerId: consumer.peerId
				});

			return;
		}

		if (!mediaConsumer) {
			logger.warn('AudioView: mediaService consumer not found %O',
				{
					consumerId: consumer.id,
					peerId: consumer.peerId
				});

			return;
		}

		const { track } = mediaConsumer;

		if (!track) {
			logger.warn('AudioView: no track on mediaService consumer %O',
				{
					consumerId: consumer.id,
					peerId: consumer.peerId
				});

			return;
		}

		const { audioGain } = consumer;

		logger.debug('AudioView: attaching track to audio element %O',
			{
				consumerId: consumer.id,
				peerId: consumer.peerId,
				deviceId: deviceId ?? 'default',
				audioGain
			});

		if (audioGain !== undefined)
			currentAudioElement.volume = audioGain;

		const stream = new MediaStream();

		stream.addTrack(track);
		currentAudioElement.srcObject = stream;

		if (deviceId && deviceId !== 'default') {
			logger.debug('AudioView: attempting setSinkId %O',
				{
					consumerId: consumer.id,
					peerId: consumer.peerId,
					deviceId
				});

			// runtime feature detection, regardless of TS typings
			const elementWithSink = currentAudioElement as unknown as {
				// eslint-disable-next-line no-unused-vars
				setSinkId?: (deviceId: string) => Promise<void>;
			};

			if (typeof elementWithSink.setSinkId === 'function') {
				elementWithSink.setSinkId(deviceId)
					.then(() => {
						logger.debug('AudioView: setSinkId succeeded %O',
							{
								consumerId: consumer.id,
								peerId: consumer.peerId,
								deviceId
							});
					})
					.catch((error: unknown) => {
						logger.warn('AudioView: setSinkId FAILED %O',
							{
								consumerId: consumer.id,
								peerId: consumer.peerId,
								deviceId,
								error
							});
					});
			} else {
				logger.warn('AudioView: setSinkId not supported on this browser %O',
					{
						consumerId: consumer.id,
						peerId: consumer.peerId,
						deviceId
					});
			}
		} else {
			logger.debug('AudioView: using default output device (no setSinkId) %O',
				{
					consumerId: consumer.id,
					peerId: consumer.peerId,
					deviceId: deviceId ?? 'default'
				});
		}

		return () => {
			logger.debug('AudioView: cleanup %O',
				{
					consumerId: consumer.id,
					peerId: consumer.peerId
				});

			if (currentAudioElement) {
				currentAudioElement.srcObject = null;
			}
		};
	}, [ deviceId, consumer.id ]);

	useEffect(() => {
		const { audioGain } = consumer;
		const currentAudioElement = audioElement.current;

		if (audioGain !== undefined && currentAudioElement) {
			logger.debug('AudioView: updating audioGain %O',
				{
					consumerId: consumer.id,
					peerId: consumer.peerId,
					audioGain
				});

			currentAudioElement.volume = audioGain;
		}
	}, [ consumer.audioGain ]);

	return (
		<audio
			ref={audioElement}
			autoPlay
		/>
	);
};

export default AudioView;