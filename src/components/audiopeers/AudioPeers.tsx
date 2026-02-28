import { useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { audioConsumerSelector } from '../../store/selectors';
import AudioView from '../audioview/AudioView';
import { Logger } from '../../utils/Logger';

const logger = new Logger('AudioPeers');

const AudioPeers = (): React.JSX.Element => {
	const micConsumers = useAppSelector(audioConsumerSelector);
	const deviceId = useAppSelector((state) => state.settings.selectedAudioOutputDevice);

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
				!consumer.localPaused && !consumer.remotePaused && <AudioView
					key={consumer.id}
					consumer={consumer}
					deviceId={deviceId}
				/>
			)) }
		</div>
	);
};

export default AudioPeers;