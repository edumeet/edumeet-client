import { useContext } from 'react';
import { Tooltip } from '@mui/material';
import { SignalCellularConnectedNoInternet0Bar } from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import { ServiceContext } from '../../store/store';
import { PROBLEM_INDICATOR_GRACE_ROUNDS, graceMs, useSustained } from '../../utils/useSustained';
import { noAudioArrivingLabel, noMediaArrivingLabel, noVideoArrivingLabel } from '../translated/translatedComponents';
import { usePeerProblem } from './useProblems';

interface PeerMediaIndicatorProps {
	displayName: string;
	audioConsumerId?: string;
	videoConsumerId?: string;
}

/**
 * Participant list mark for one peer: nothing usable is arriving from them.
 * Named after the person so a moderator knows whom to ask to reconnect. It is
 * the only per-peer signal shown without pressing Q.
 */
const PeerMediaIndicator = ({ displayName, audioConsumerId, videoConsumerId }: PeerMediaIndicatorProps): React.JSX.Element => {
	useAppSelector((state) => state.settings.locale);

	const { mediaService } = useContext(ServiceContext);
	const problem = usePeerProblem({ audio: audioConsumerId, video: videoConsumerId });
	const sustained = useSustained(Boolean(problem), graceMs(mediaService.monitor, PROBLEM_INDICATOR_GRACE_ROUNDS));

	if (!problem || !sustained) return <></>;

	const title = problem.audio && problem.video
		? noMediaArrivingLabel(displayName)
		: problem.video ? noVideoArrivingLabel(displayName) : noAudioArrivingLabel(displayName);

	return (
		<Tooltip title={title}>
			<SignalCellularConnectedNoInternet0Bar fontSize='small' color='error' role='img' aria-label={title} />
		</Tooltip>
	);
};

export default PeerMediaIndicator;
