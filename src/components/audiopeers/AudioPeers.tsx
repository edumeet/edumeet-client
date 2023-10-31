import { useAppSelector } from '../../store/hooks';
import { audioConsumerSelector } from '../../store/selectors';
import AudioView from '../audioview/AudioView';

const AudioPeers = (): JSX.Element => {
	const micConsumers = useAppSelector(audioConsumerSelector);

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