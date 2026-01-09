import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';
import { SignalCellularAlt } from '@mui/icons-material';

const QualityIndicator = (): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ isDistorted, setDistorted ] = useState<boolean>(false);

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.monitor;
		
		if (!monitor) {
			return;
		}

		const update = () => {
			const activeIssues = (monitor as unknown as {
				activeIssues?: Record<string, unknown[]>;
			}).activeIssues;

			const congestionIssues = activeIssues?.congestion ?? [ ];

			setDistorted(congestionIssues.length > 0);
		};

		update();

		const onIssue = (issue: unknown) => {
			const type = (issue as { type?: string }).type;

			if (type === 'congestion') {
				update();
			}
		};

		const onResolvedIssue = (issue: unknown) => {
			const type = (issue as { type?: string }).type;

			if (type === 'congestion') {
				update();
			}
		};

		monitor.on('issue', onIssue);
		monitor.on('resolved-issue', onResolvedIssue);

		return () => {
			if (!monitor) {
				return;
			}
			
			monitor.off('issue', onIssue);
			monitor.off('resolved-issue', onResolvedIssue);
		};
	}, [ mediaService, mediaService.monitor ]);

	return (<div>
		{isDistorted ? (
			<Stats
				orientation='vertical'
				horizontalPlacement='right'
				verticalPlacement='top'
			>
				
				<SignalCellularAlt style={{ color: 'red' }}/>
			</Stats>
		) : (<></>)}
	</div>);
};

export default QualityIndicator;