import { useAppSelector } from '../../store/hooks';
import { micConsumerSelector } from '../../store/selectors';
import AudioView from '../audioview/AudioView';

const AudioPeers = (): React.JSX.Element => {
	const micConsumers = useAppSelector(micConsumerSelector);
	const deviceId = useAppSelector((state) => state.media.liveAudioOutputDeviceId);

	return (
		<div>
			{ micConsumers.map((consumer) => (
				!consumer.localPaused && !consumer.remotePaused && !consumer.producerPaused && <AudioView
					key={consumer.id}
					consumer={consumer}
					deviceId={deviceId}
				/>
			)) }
		</div>
	);
};

export default AudioPeers;