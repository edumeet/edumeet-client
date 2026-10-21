import { useEffect, useRef } from 'react';
import { useAppSelector } from '../../store/hooks';
import { audioConsumerSelector } from '../../store/selectors';
import AudioView from '../audioview/AudioView';
import { Logger } from '../../utils/Logger';
import { playedAudioConsumerIds } from '../../utils/playedAudioConsumers';

const logger = new Logger('AudioPeers');

const AudioPeers = (): React.JSX.Element => {
	const micConsumers = useAppSelector(audioConsumerSelector);
	const deviceId = useAppSelector((state) => state.settings.selectedAudioOutputDevice);
	const played = useRef<Set<string>>(new Set());

	played.current = playedAudioConsumerIds(micConsumers, played.current);

	useEffect(() => {
		micConsumers.forEach((consumer) => {
			logger.debug('AudioPeers: consumer render state %O',
				{
					consumerId: consumer.id,
					peerId: consumer.peerId,
					kind: consumer.kind,
					localPaused: consumer.localPaused,
					remotePaused: consumer.remotePaused
				});
		});
	}, [ micConsumers ]);

	return (
		<div>
			{ micConsumers.map((consumer) => (
				played.current.has(consumer.id) && <AudioView
					key={consumer.id}
					consumer={consumer}
					deviceId={deviceId}
				/>
			)) }
		</div>
	);
};

export default AudioPeers;