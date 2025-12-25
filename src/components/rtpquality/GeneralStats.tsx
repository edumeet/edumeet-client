import { 
	Paper, 
	TableBody, 
	Table, 
	TableContainer,
	TableCell,
	TableRow,
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { ServiceContext } from '../../store/store';

type Stats = {
	name: string,
	value: string,
}

const GeneralStats = (): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ generalStats, setGeneralStats ] = useState<Stats[]>([]);

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.monitor;
		
		if (!monitor) {
			return;
		}
		
		const listener = () => {
			// v4: no monitor.storage; use monitor.tracks + monitor.peerConnections
			const tracks = (monitor as unknown as {
				tracks?: Array<{
					kind?: 'audio' | 'video';
					direction?: 'inbound' | 'outbound';
					bitrate?: number;
				}>;
				peerConnections?: Array<{
					avgRttInS?: number;
				}>;
			}).tracks ?? [ ];

			const pcs = (monitor as unknown as {
				peerConnections?: Array<{
					avgRttInS?: number;
				}>;
			}).peerConnections ?? [ ];

			let receivingAudioBitrate = 0;
			let receivingVideoBitrate = 0;
			let sendingAudioBitrate = 0;
			let sendingVideoBitrate = 0;

			for (const track of tracks) {
				const bitrate = track.bitrate ?? 0;

				if (track.direction === 'inbound') {
					if (track.kind === 'audio') receivingAudioBitrate += bitrate;
					else if (track.kind === 'video') receivingVideoBitrate += bitrate;
				} else if (track.direction === 'outbound') {
					if (track.kind === 'audio') sendingAudioBitrate += bitrate;
					else if (track.kind === 'video') sendingVideoBitrate += bitrate;
				}
			}

			let rttInMs = 0;

			for (const pc of pcs) {
				if (pc.avgRttInS && pc.avgRttInS > 0) {
					rttInMs += pc.avgRttInS * 1000;
				}
			}

			const stats: Stats[] = [ {
				name: 'Downstream Audio',
				value: `${Math.ceil((receivingAudioBitrate ?? 0) / 1000)} kbps`,
			}, {
				name: 'Downstream Video',
				value: `${Math.ceil((receivingVideoBitrate ?? 0) / 1000)} kbps`,
			}, {
				name: 'Upstream Audio',
				value: `${Math.ceil((sendingAudioBitrate ?? 0) / 1000)} kbps`,
			}, {
				name: 'Upstream Video',
				value: `${Math.ceil((sendingVideoBitrate ?? 0) / 1000)} kbps`,
			}, {
				name: 'Round Trip Time',
				value: `${Math.ceil(rttInMs)} ms`,
			} ];
			
			setGeneralStats(stats);

		};

		monitor.on('stats-collected', listener);
		
		return () => {
			if (!monitor) {
				return;
			}
			monitor.off('stats-collected', listener);
		};
	}, [ mediaService, mediaService.monitor ]);

	return (
		<TableContainer component={Paper}>
			<Table sx={{ minWidth: 650 }} aria-label="simple table">
				<TableBody>
					{ generalStats.map((row, index) => (
						<TableRow
							key={index}
							sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
						>
							<TableCell component="th" scope="row">{row.name}</TableCell>
							<TableCell align="right">{row.value}</TableCell>
						</TableRow>
					)) }
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default GeneralStats;