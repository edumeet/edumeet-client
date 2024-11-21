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

const GeneralStats = (): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ generalStats, setGeneralStats ] = useState<Stats[]>([]);

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.monitor;
		
		if (!monitor) {
			return;
		}
		
		const storage = monitor.storage;
		
		const listener = () => {
			let rttInMs = 0;

			for (const pc of storage.peerConnections()) {
				if (pc.avgRttInS && pc.avgRttInS > 0) {
					rttInMs += pc.avgRttInS * 1000;
				}
			}
			const stats: Stats[] = [ {
				name: 'Downstream Audio',
				value: `${Math.ceil((storage.receivingAudioBitrate ?? 0) / 1000)} kbps`,
			}, {
				name: 'Downstream Video',
				value: `${Math.ceil((storage.receivingVideoBitrate ?? 0) / 1000)} kbps`,
			}, {
				name: 'Upstream Audio',
				value: `${Math.ceil((storage.sendingAudioBitrate ?? 0) / 1000)} kbps`,
			}, {
				name: 'Upstream Video',
				value: `${Math.ceil((storage.sendingVideoBitrate ?? 0) / 1000)} kbps`,
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
			if (listener) {
				monitor.off('stats-collected', listener);
			}
		};
	}, []);

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