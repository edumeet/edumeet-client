import React, { useContext, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { ServiceContext } from '../../store/store';
import ScoreSection from './ScoreSection';
import { useClientQuality } from './useTrackStats';

const Panel = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	gap: theme.spacing(0.5),
	padding: theme.spacing(0.75, 1),
	boxSizing: 'border-box',
	width: 'max-content',
	minWidth: 190,
	fontSize: '0.7rem',
	lineHeight: 1.35,
	color: 'white',
	backgroundColor: 'rgba(0, 0, 0, 0.72)',
	borderRadius: theme.shape.borderRadius,
}));

const Grid = styled('div')(({ theme }) => ({
	display: 'grid',
	gridTemplateColumns: 'auto auto',
	columnGap: theme.spacing(1),
	width: '100%',
}));

const Label = styled('span')({
	opacity: 0.7,
	whiteSpace: 'nowrap',
});

const Value = styled('span')({
	textAlign: 'right',
	whiteSpace: 'nowrap',
});

const Divider = styled('hr')(({ theme }) => ({
	border: 'none',
	borderTop: '1px solid rgba(255,255,255,0.25)',
	margin: theme.spacing(0.25, 0),
	width: '100%',
}));

type Row = {
	name: string;
	value: string;
};

const kbps = (bitrate?: number): string => `${Math.ceil((bitrate ?? 0) / 1000)} kbps`;

/**
 * Client level summary of the call: the overall quality score with its reasons,
 * the up/downstream bitrates and the round trip time.
 *
 * Every number here is aggregated by the client monitor itself - there is no
 * reliable way to re-add them from the individual track monitors.
 */
const GeneralStats = (): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const quality = useClientQuality();
	const [ rows, setRows ] = useState<Row[]>([]);

	useEffect(() => {
		const monitor = mediaService.monitor;

		if (!monitor) return;

		const listener = () => {
			setRows([ {
				name: 'Downstream audio',
				value: kbps(monitor.receivingAudioBitrate),
			}, {
				name: 'Downstream video',
				value: kbps(monitor.receivingVideoBitrate),
			}, {
				name: 'Upstream audio',
				value: kbps(monitor.sendingAudioBitrate),
			}, {
				name: 'Upstream video',
				value: kbps(monitor.sendingVideoBitrate),
			}, {
				name: 'Available in',
				value: kbps(monitor.totalAvailableIncomingBitrate),
			}, {
				name: 'Available out',
				value: kbps(monitor.totalAvailableOutgoingBitrate),
			}, {
				// avgRttInSec is already the average over the peer connections.
				name: 'Round trip time',
				value: `${Math.round((monitor.avgRttInSec ?? 0) * 1000)} ms`,
			} ]);
		};

		monitor.on('stats-collected', listener);
		listener();

		return () => {
			monitor.off('stats-collected', listener);
		};
	}, [ mediaService, mediaService.monitor ]);

	if (!mediaService.monitor) return <></>;

	return (
		<Panel>
			<ScoreSection
				title='CONNECTION'
				score={quality?.score}
				reasons={quality?.reasons}
				issues={quality?.issues}
			/>
			<Divider />
			<Grid>
				{ rows.map((row) => (
					<React.Fragment key={row.name}>
						<Label>{row.name}</Label>
						<Value>{row.value}</Value>
					</React.Fragment>
				)) }
			</Grid>
		</Panel>
	);
};

export default GeneralStats;
