import { useContext, useEffect, useRef } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { ServiceContext } from '../../store/store';
import { HTMLMediaElementWithSink } from '../../utils/types';
import { isSinkIdSupported } from '../../store/selectors';
import { Logger } from '../../utils/Logger';
import { useAppDispatch } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';

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
	const dispatch = useAppDispatch();
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

		let active = true;
		let blocked = false;

		const startPlayback = (): void => {
			currentAudioElement.play()
				.then(() => {
					if (!active || !blocked) return;

					blocked = false;
					stopWaitingForGesture();
					dispatch(uiActions.removeBlockedAudioConsumer(consumer.id));
				})
				.catch((error: unknown) => {
					if (!active) return;

					if (!(error instanceof DOMException && error.name === 'NotAllowedError')) {
						logger.warn('AudioView: play() failed %O',
							{
								consumerId: consumer.id,
								peerId: consumer.peerId,
								error
							});

						return;
					}

					logger.debug('AudioView: playback blocked by autoplay policy %O',
						{
							consumerId: consumer.id,
							peerId: consumer.peerId
						});

					if (blocked) return;

					blocked = true;
					document.addEventListener('click', startPlayback, true);
					document.addEventListener('keydown', startPlayback, true);
					dispatch(uiActions.addBlockedAudioConsumer(consumer.id));
				});
		};

		const stopWaitingForGesture = (): void => {
			document.removeEventListener('click', startPlayback, true);
			document.removeEventListener('keydown', startPlayback, true);
		};

		startPlayback();

		if (deviceId) {
			logger.debug('AudioView: attempting setSinkId %O',
				{
					consumerId: consumer.id,
					peerId: consumer.peerId,
					deviceId
				});

			if (isSinkIdSupported()) {
				currentAudioElement.setSinkId(deviceId)
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

			active = false;
			stopWaitingForGesture();
			if (blocked) dispatch(uiActions.removeBlockedAudioConsumer(consumer.id));

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