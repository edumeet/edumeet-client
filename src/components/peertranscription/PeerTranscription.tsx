import { usePeerTranscripts } from '../../store/hooks';
import Transcript from '../transcription/Transcript';
import Transcription from '../transcription/Transcription';

interface PeerTranscriptionProps {
	id: string;
}

const PeerTranscription = ({
	id,
}: PeerTranscriptionProps): React.JSX.Element => {
	const transcripts = usePeerTranscripts(id);

	return (
		<Transcription
			orientation='vertical'
			horizontalPlacement='center'
			verticalPlacement='bottom'
		>
			{transcripts.map((transcript) => (
				<Transcript key={transcript.id}>
					{transcript.transcript}
				</Transcript>
			))}
		</Transcription>
	);
};

export default PeerTranscription;