import { useAppSelector } from '../../store/hooks';
import { audioConsumerSelector } from '../../store/selectors';
import AudioView from '../audioview/AudioView';

const AudioPeers = (): JSX.Element => {
	const micConsumers = useAppSelector(audioConsumerSelector);
	const deviceId = useAppSelector((state) => state.settings.selectedAudioOutputDevice);

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