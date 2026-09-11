import { styled } from '@mui/material/styles';
import Stats from './Stats';
import ScoreSection from './ScoreSection';
import { TrackStats, useInboundTrackStats } from './useTrackStats';

const Divider = styled('hr')(({ theme }) => ({
	border: 'none',
	borderTop: '1px solid rgba(255,255,255,0.25)',
	margin: theme.spacing(0.5, 0),
	width: '100%',
}));

const Section = styled('div')({
	width: '100%',
	whiteSpace: 'nowrap',
});

const Muted = styled('span')({
	opacity: 0.7,
});

interface PeerStatsViewProps {
	consumerId: string;
	audioConsumerId?: string;
}

const layerLine = (stats: TrackStats): string | undefined => {
	if (stats.spatialLayer === undefined && stats.preferredSpatialLayer === undefined) return undefined;

	const spatial = `${stats.spatialLayer ?? '?'}/${stats.preferredSpatialLayer ?? '?'}`;
	const temporal = `${stats.temporalLayer ?? '?'}/${stats.preferredTemporalLayer ?? '?'}`;

	return `SL: ${spatial} | TL: ${temporal}`;
};

const TrackBlock = ({ label, stats }: { label: string, stats: TrackStats }): React.JSX.Element => {
	const layers = layerLine(stats);

	return (
		<Section>
			<ScoreSection title={label} score={stats.score} reasons={stats.reasons} issues={stats.issues} />
			<Muted>SSRC: {stats.ssrc ?? '?'}{ stats.paused && ' (paused)' }</Muted><br />
			{ stats.codec && <>{stats.codec}{ stats.mode ? ` ${stats.mode}` : '' }<br /></> }
			{ stats.frameWidth && stats.frameHeight &&
				<>{stats.frameWidth}x{stats.frameHeight}@{stats.fps ?? '?'}<br /></>
			}
			{ layers && <>{layers}<br /></> }
			{stats.bitrateKbps ?? -1} kbps
			{ stats.fractionLost !== undefined && <> | loss: {stats.fractionLost}</> }
			{ stats.jitterMs !== undefined && <> | jitter: {stats.jitterMs} ms</> }
		</Section>
	);
};

/**
 * Quality window for a remote peer's tile: the score of each consumed track,
 * the reasons that score is not perfect, and the raw RTP numbers behind it.
 */
const PeerStatsView = ({ consumerId, audioConsumerId }: PeerStatsViewProps): React.JSX.Element => {
	const videoStats = useInboundTrackStats(consumerId);
	const audioStats = useInboundTrackStats(audioConsumerId);

	return (
		<Stats
			orientation='vertical'
			horizontalPlacement='left'
			verticalPlacement='top'
		>
			{ !videoStats && !audioStats && <div>...</div> }
			{ videoStats && <TrackBlock label='VIDEO' stats={videoStats} /> }
			{ videoStats && audioStats && <Divider /> }
			{ audioStats && <TrackBlock label='AUDIO' stats={audioStats} /> }
		</Stats>
	);
};

export default PeerStatsView;
