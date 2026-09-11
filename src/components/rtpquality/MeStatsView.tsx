import { styled } from '@mui/material/styles';
import Stats from './Stats';
import ScoreSection from './ScoreSection';
import { TrackStats, useOutboundTrackStats } from './useTrackStats';
import { ProducerSource } from '../../utils/types';

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

interface MeStatsViewProps {
	// The produced video source shown on this tile.
	source?: ProducerSource;
	// The produced audio source shown alongside it. Defaults to the microphone.
	audioSource?: ProducerSource;
}

const TrackBlock = ({ label, stats }: { label: string, stats: TrackStats }): React.JSX.Element => {
	const layers = stats.layers ?? [];

	return (
		<Section>
			<ScoreSection title={label} score={stats.score} reasons={stats.reasons} issues={stats.issues} />
			{ stats.codec && <>{stats.codec}{ stats.mode ? ` ${stats.mode}` : '' }<br /></> }
			{stats.bitrateKbps ?? -1} kbps
			{ stats.rttMs !== undefined && <> | RTT: {stats.rttMs} ms</> }
			{ stats.fractionLost !== undefined && <> | loss: {stats.fractionLost}</> }
			{ stats.paused && <> | paused</> }
			<br />
			{ layers.length > 0 ? layers.map((layer) => (
				<span key={layer.ssrc}>
					<Muted>SSRC: {layer.ssrc}{ layer.rid ? ` (${layer.rid})` : '' }</Muted>
					{ layer.frameWidth && layer.frameHeight &&
						<> {layer.frameWidth}x{layer.frameHeight}@{layer.fps ?? '?'}</>
					}
					{ layer.bitrateKbps !== undefined && <> {layer.bitrateKbps} kbps</> }
					<br />
				</span>
			)) : <Muted>SSRC: {stats.ssrc ?? '?'}</Muted> }
		</Section>
	);
};

/**
 * Quality window for the local tile. Shows the score the client monitor
 * calculates for each produced track together with the reasons behind it, so
 * sending problems (capture, encoder, uplink) are visible where they happen.
 */
const MeStatsView = ({
	source = 'webcam',
	audioSource = 'mic',
}: MeStatsViewProps): React.JSX.Element => {
	const videoStats = useOutboundTrackStats(source);
	const audioStats = useOutboundTrackStats(audioSource);

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

export default MeStatsView;
