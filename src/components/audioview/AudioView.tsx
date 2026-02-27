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
			logger.warn({
				consumerId: consumer.id,
				peerId: consumer.peerId
			}, 'AudioView: audio element ref not ready');

			return;
		}

		if (!mediaConsumer) {
			logger.warn({
				consumerId: consumer.id,
				peerId: consumer.peerId
			}, 'AudioView: mediaService consumer not found');

			return;
		}

		const { track } = mediaConsumer;

		if (!track) {
			logger.warn({
				consumerId: consumer.id,
				peerId: consumer.peerId
			}, 'AudioView: no track on mediaService consumer');

			return;
		}

		const { audioGain } = consumer;

		logger.debug({
			consumerId: consumer.id,
			peerId: consumer.peerId,
			deviceId: deviceId ?? 'default',
			audioGain
		}, 'AudioView: attaching track to audio element');

		if (audioGain !== undefined)
			currentAudioElement.volume = audioGain;

		const stream = new MediaStream();

		stream.addTrack(track);
		currentAudioElement.srcObject = stream;

		if (deviceId && deviceId !== 'default') {
			logger.debug({
				consumerId: consumer.id,
				peerId: consumer.peerId,
				deviceId
			}, 'AudioView: attempting setSinkId');

			// runtime feature detection, regardless of TS typings
			const elementWithSink = currentAudioElement as unknown as {
				setSinkId?: (_deviceId: string) => Promise<void>;
			};

			if (typeof elementWithSink.setSinkId === 'function') {
				elementWithSink.setSinkId(deviceId)
					.then(() => {
						logger.debug({
							consumerId: consumer.id,
							peerId: consumer.peerId,
							deviceId
						}, 'AudioView: setSinkId succeeded');
					})
					.catch((error: unknown) => {
						logger.warn({
							consumerId: consumer.id,
							peerId: consumer.peerId,
							deviceId,
							error
						}, 'AudioView: setSinkId FAILED');
					});
			} else {
				logger.warn({
					consumerId: consumer.id,
					peerId: consumer.peerId,
					deviceId
				}, 'AudioView: setSinkId not supported on this browser');
			}
		} else {
			logger.debug({
				consumerId: consumer.id,
				peerId: consumer.peerId,
				deviceId: deviceId ?? 'default'
			}, 'AudioView: using default output device (no setSinkId)');
		}

		return () => {
			logger.debug({
				consumerId: consumer.id,
				peerId: consumer.peerId
			}, 'AudioView: cleanup');

			if (currentAudioElement) {
				currentAudioElement.srcObject = null;
			}
		};
	}, [ deviceId, consumer.id ]);

	useEffect(() => {
		const { audioGain } = consumer;
		const currentAudioElement = audioElement.current;

		if (audioGain !== undefined && currentAudioElement) {
			logger.debug({
				consumerId: consumer.id,
				peerId: consumer.peerId,
				audioGain
			}, 'AudioView: updating audioGain');

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