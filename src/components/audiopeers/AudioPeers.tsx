import { useAppSelector } from '../../store/hooks';
import { micConsumerSelector } from '../../store/selectors';
import AudioView from '../audioview/AudioView';

const AudioPeers = (): JSX.Element => {
	const micConsumers = useAppSelector(micConsumerSelector);

	return (
		<div>
			{ micConsumers.map((consumer) => (
				!consumer.localPaused && !consumer.remotePaused && <AudioView
					key={consumer.id}
					consumer={consumer}
				/>
			)) }
		</div>
	);
};

export default AudioPeers;